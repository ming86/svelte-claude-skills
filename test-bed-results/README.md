# Skill Activation Hooks

Two approaches for improving skill activation via UserPromptSubmit
hooks in Claude Code.

## The Problem

Skills are valuable domain-specific guidance, but they often don't get
activated because:

- Generic hook messages are easy to ignore
- No forced evaluation of available skills
- Passive reminders don't require conscious decision-making
- Claude may start implementation before checking skills

## The Solutions

### Approach 1: Forced Explicit Evaluation

**File**: `skill-forced-eval-hook.sh`

**How it works**:

- Outputs mandatory instructions requiring explicit skill evaluation
- Forces Claude to list EVERY available skill
- Requires YES/NO decision for each skill with justification
- Blocks implementation until evaluation is complete

**Pros**:

- ✅ Simple, no external dependencies
- ✅ Forces conscious decision-making
- ✅ Creates an audit trail of skill evaluation
- ✅ Works offline
- ✅ Deterministic behavior

**Cons**:

- ❌ Adds verbosity to every interaction
- ❌ Still relies on Claude's judgment (can be ignored)
- ❌ May feel tedious for simple tasks

**Best for**:

- Evals where you want to verify skill-checking behavior
- Training scenarios
- Complex tasks where skill guidance is critical

### Approach 2: LLM-Based Intelligent Evaluation

**File**: `skill-llm-eval-hook.sh`

**How it works**:

- Calls Claude API (Haiku) with user prompt + available skills
- LLM evaluates which skills are relevant
- Returns specific activation instructions
- Falls back to generic reminder if API unavailable

**Pros**:

- ✅ Intelligent, context-aware evaluation
- ✅ No brittle keyword matching
- ✅ Minimal verbosity (only suggests relevant skills)
- ✅ Uses cheap Haiku model (~$0.001 per eval)
- ✅ Non-brittle pattern matching

**Cons**:

- ❌ Requires API key and internet
- ❌ Adds latency (~200-500ms)
- ❌ Has API costs (minimal)
- ❌ Can still be ignored by Claude
- ❌ More complex setup

**Best for**:

- Production use where you want smart suggestions
- Reducing noise while maintaining accuracy
- Users willing to set up API access

## Installation

### Approach 1: Forced Evaluation

```bash
# Copy hook to Claude Code hooks directory
cp skill-forced-eval-hook.sh ~/.claude/hooks/UserPromptSubmit

# Make executable (should already be set)
chmod +x ~/.claude/hooks/UserPromptSubmit
```

### Approach 2: LLM Evaluation

```bash
# Set API key (add to ~/.bashrc or ~/.zshrc)
export ANTHROPIC_API_KEY="your-api-key-here"

# Copy hook to Claude Code hooks directory
cp skill-llm-eval-hook.sh ~/.claude/hooks/UserPromptSubmit

# Make executable
chmod +x ~/.claude/hooks/UserPromptSubmit
```

## Testing

### Test Approach 1 (Forced Eval)

```bash
# Simulate a prompt that should trigger skills
./skill-forced-eval-hook.sh "Create a theme store with $state in SvelteKit"
```

Expected output:

```
INSTRUCTION: MANDATORY SKILL EVALUATION REQUIRED

Before proceeding with ANY implementation:
[...instructions...]
```

### Test Approach 2 (LLM Eval)

```bash
# Set API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Simulate prompt with skills context
./skill-llm-eval-hook.sh \
  "Create a theme store with \$state in SvelteKit" \
  "svelte5-runes: Svelte 5 runes guidance
sveltekit-structure: SvelteKit structure guidance"
```

Expected output:

```
INSTRUCTION: LLM evaluation determined these skills are relevant: svelte5-runes,sveltekit-structure

You MUST activate these skills using the Skill() tool BEFORE implementation:
- Skill(svelte5-runes)
- Skill(sveltekit-structure)
```

## Hook Parameters

Claude Code passes these parameters to UserPromptSubmit hooks:

1. `$1` - The user's prompt text
2. `$2` - Available skills (formatted list)
3. Additional context may be available via environment variables

## Comparison

| Feature     | Forced Eval      | LLM Eval           |
| ----------- | ---------------- | ------------------ |
| Accuracy    | Relies on Claude | Uses dedicated LLM |
| Setup       | Copy file        | API key required   |
| Speed       | Instant          | ~200-500ms         |
| Cost        | Free             | ~$0.001/eval       |
| Offline     | ✅ Yes           | ❌ No              |
| Verbosity   | High             | Low                |
| Bypassable  | Yes (can ignore) | Yes (can ignore)   |
| Brittleness | N/A              | Non-brittle        |

## Combining Approaches

You can also create a hybrid:

```bash
#!/bin/bash
# Try LLM eval first, fall back to forced eval

if [ -n "$ANTHROPIC_API_KEY" ]; then
    # Run LLM evaluation
    source skill-llm-eval-hook.sh "$@"
else
    # Fall back to forced evaluation
    source skill-forced-eval-hook.sh "$@"
fi
```

## Why These Work Better Than Keyword Matching

**Keyword matching is brittle**:

- Requires maintenance for each skill
- Prone to false positives/negatives
- Breaks when skill descriptions change
- Can't handle context or nuance

**These approaches**:

- Use LLM judgment (non-brittle semantic understanding)
- Force explicit evaluation (creates accountability)
- Work with any skill set without modification
- Handle complex, multi-faceted tasks

## Limitations

Both approaches still have a fundamental limitation: **Claude can
ignore the instructions**.

To truly enforce skill activation, you'd need:

1. Hook that blocks execution until skills are activated (not
   currently possible)
2. System-level validation that skill evaluation occurred
3. Eval framework that checks for skill activation in transcripts

For evals, you can check transcripts for:

- `Skill(skill-name)` tool calls
- Explicit skill evaluation text
- Presence of skill-loaded messages

## License

MIT - Use these however you want for your evals.

## Contributing

Found a better approach? Open a PR or issue.
