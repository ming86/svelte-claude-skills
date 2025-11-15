#!/bin/bash
# UserPromptSubmit hook that uses Claude API for intelligent skill evaluation
#
# This hook calls Claude API to evaluate which skills are relevant
# and generates specific activation instructions.
#
# Installation:
# 1. Set ANTHROPIC_API_KEY environment variable
# 2. Copy to .claude/hooks/UserPromptSubmit

# Read JSON input from stdin with timeout
INPUT_JSON=$(timeout 2 cat || echo '{}')

# Extract user prompt and cwd from JSON
USER_PROMPT=$(echo "$INPUT_JSON" | jq -r '.prompt // ""' 2>/dev/null)
CWD=$(echo "$INPUT_JSON" | jq -r '.cwd // ""' 2>/dev/null)

# Use CLAUDE_PROJECT_DIR if CWD is empty
if [ -z "$CWD" ] || [ "$CWD" = "null" ]; then
    CWD="${CLAUDE_PROJECT_DIR:-.}"
fi

# Get available skills from .claude/skills directory
SKILLS_DIR="$CWD/.claude/skills"
if [ -d "$SKILLS_DIR" ]; then
    AVAILABLE_SKILLS=$(ls "$SKILLS_DIR" 2>/dev/null | sed 's/\.md$//' | paste -sd ',' -)
else
    AVAILABLE_SKILLS="No local skills found"
fi

# Debug: Show what we received
echo "DEBUG: USER_PROMPT = '$USER_PROMPT'"
echo "DEBUG: AVAILABLE_SKILLS = '$AVAILABLE_SKILLS'"

# Fallback instruction message
FALLBACK_INSTRUCTION="INSTRUCTION: If the prompt matches any available skill keywords, use Skill(skill-name) to activate it."

# Check if API key is set in environment, otherwise try to read from credentials file
if [ -z "$ANTHROPIC_API_KEY" ]; then
    CREDENTIALS_FILE="$HOME/.claude/.credentials.json"
    if [ -f "$CREDENTIALS_FILE" ]; then
        ANTHROPIC_API_KEY=$(jq -r '.ANTHROPIC_API_KEY // ""' "$CREDENTIALS_FILE" 2>/dev/null)
    fi
fi

# If still no API key, fall back
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "[HOOK: skill-llm-eval-hook.sh - FALLBACK MODE]"
    echo "WARNING: ANTHROPIC_API_KEY not set. Falling back to generic instruction."
    echo "$FALLBACK_INSTRUCTION"
    exit 0
fi

echo "[HOOK: skill-llm-eval-hook.sh - LLM MODE]"

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
RAW_TEXT=$(echo "$RESPONSE" | jq -r '.content[0].text' 2>/dev/null)

# Debug output
echo "DEBUG: RAW_TEXT = $RAW_TEXT"

# Check if we got a valid response
if [ $? -ne 0 ] || [ -z "$RAW_TEXT" ]; then
    echo "[HOOK: skill-llm-eval-hook.sh - API FAILURE FALLBACK]"
    echo "WARNING: Failed to evaluate skills via API. Falling back to generic instruction."
    echo "$FALLBACK_INSTRUCTION"
    exit 0
fi

# Strip markdown code fences if present and extract JSON
SKILLS=$(echo "$RAW_TEXT" | sed -n '/^\[/,/^\]/p' | head -n 1)

# If that didn't work, try the whole text
if [ -z "$SKILLS" ]; then
    SKILLS="$RAW_TEXT"
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
    echo "[HOOK: skill-llm-eval-hook.sh - PARSING FAILURE FALLBACK]"
    echo "$FALLBACK_INSTRUCTION"
fi
