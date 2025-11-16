#!/bin/bash
# UserPromptSubmit hook that uses Claude API for intelligent skill evaluation
#
# This hook calls Claude API to evaluate which skills are relevant
# and generates specific activation instructions.
#
# Installation:
# 1. Set ANTHROPIC_API_KEY environment variable
# 2. Copy to .claude/hooks/UserPromptSubmit

USER_PROMPT="$1"
AVAILABLE_SKILLS="$2"

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "WARNING: ANTHROPIC_API_KEY not set. Falling back to generic instruction."
    echo "INSTRUCTION: If the prompt matches any available skill keywords, use Skill(skill-name) to activate it."
    exit 0
fi

# Prepare the evaluation prompt
EVAL_PROMPT=$(cat <<EOF
You are evaluating which skills should be activated for a user's request.

USER REQUEST:
${USER_PROMPT}

AVAILABLE SKILLS:
${AVAILABLE_SKILLS}

Analyze the user's request and determine which skills (if any) are relevant.
For each relevant skill, consider:
- Does the task involve the skill's domain?
- Would the skill provide guidance that prevents common mistakes?
- Is the skill's expertise needed before implementation?

Respond with ONLY a JSON array of relevant skill names, or empty array if none are relevant.
Example: ["svelte5-runes", "sveltekit-structure"]
Example: []

Response:
EOF
)

# Call Claude API
RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
    -H "content-type: application/json" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -d "{
        \"model\": \"claude-3-5-haiku-20241022\",
        \"max_tokens\": 200,
        \"messages\": [{
            \"role\": \"user\",
            \"content\": $(echo "$EVAL_PROMPT" | jq -Rs .)
        }]
    }")

# Extract the skill list from response
SKILLS=$(echo "$RESPONSE" | jq -r '.content[0].text' 2>/dev/null)

# Check if we got a valid response
if [ $? -ne 0 ] || [ -z "$SKILLS" ]; then
    echo "WARNING: Failed to evaluate skills via API. Falling back to generic instruction."
    echo "INSTRUCTION: If the prompt matches any available skill keywords, use Skill(skill-name) to activate it."
    exit 0
fi

# Parse the skills array
SKILL_COUNT=$(echo "$SKILLS" | jq 'length' 2>/dev/null)

if [ "$SKILL_COUNT" = "0" ]; then
    echo "INSTRUCTION: LLM evaluation determined no skills are needed for this task."
elif [ -n "$SKILL_COUNT" ] && [ "$SKILL_COUNT" != "null" ]; then
    SKILL_NAMES=$(echo "$SKILLS" | jq -r '.[]' | paste -sd ',' -)
    echo "INSTRUCTION: LLM evaluation determined these skills are relevant: $SKILL_NAMES"
    echo ""
    echo "You MUST activate these skills using the Skill() tool BEFORE implementation:"
    echo "$SKILLS" | jq -r '.[] | "- Skill(\(.))\"'
else
    # Fallback if parsing failed
    echo "INSTRUCTION: If the prompt matches any available skill keywords, use Skill(skill-name) to activate it."
fi
