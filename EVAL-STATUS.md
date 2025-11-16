# Skill Evaluation System Status

## Current State

**Goal**: Create reliable Svelte/SvelteKit skills that activate
consistently in real-world usage.

**Problem**: API-based evals don't match manual testing results.

## Manual Testing Results (40 tests)

| Hook Type     | Activation Rate | Status          |
| ------------- | --------------- | --------------- |
| Forced Eval   | 10/10 = 100%    | ✅ Best         |
| LLM Eval      | 6/10 = 60%      | 🟡 Inconsistent |
| Simple Script | 4/10 = 40%      | 🟠 Poor         |
| Inline Echo   | 2/10 = 20%      | 🔴 Worst        |

**Test Prompt**: "Create a new route at /posts/new with a form to
create a blog post (title and content fields). On successful
submission, redirect to /posts. Show validation errors if title is
empty."

**Environment**: Fresh SvelteKit project in `test-bed/`, Claude Code
CLI v2.0.42

## API Eval Results (Unreliable)

**Location**: `src/lib/evals.remote.ts`

**Current Issues**:

1. ❌ Old test cases (keyword-based "How do I...?") → 100% activation
   (unrealistic)
2. ❌ New test cases (realistic implementation prompts) → 0%
   activation (too pessimistic)
3. ❌ Evals run full implementations instead of just checking skill
   activation
4. ❌ Missing project context that Claude Code CLI has (package.json,
   etc.)

## Why API Evals Don't Work

The Agent SDK `query()` function:

- Runs in `cwd: process.cwd()` (root project, not test-bed)
- Has `allowedTools: ['Skill']` but Claude still tries to
  explore/implement
- Uses `maxTurns: 1` to stop early, but misses skill activation window
- Lacks SvelteKit project context that triggers skills naturally

## Next Steps

### 1. Fix API Eval Context

- [ ] Set `cwd` to actual SvelteKit project with package.json
- [ ] Add system prompt with project context ("You're in a SvelteKit
      project...")
- [ ] Verify `<available_skills>` is populated in system prompt

### 2. Automate Hook Comparison

- [ ] Run evals with each hook config (none, simple, llm-eval, forced)
- [ ] Store hook_config in database (migration already created)
- [ ] Generate comparison report from `v_hook_effectiveness` view

### 3. Validate Forced-Eval Hook

- [ ] Run 100+ automated tests with forced-eval hook
- [ ] Verify it maintains high activation rate programmatically
- [ ] Compare against baseline (no hook)

### 4. Polish Skills

- [ ] Improve skill descriptions for better autonomous activation
- [ ] Add real-world test scenarios from manual testing
- [ ] Document which mistakes each skill prevents

## Key Files

- **Manual test results**: `manual-testing-hooks.md`
- **Eval code**: `src/lib/evals.remote.ts`
- **Test cases**: `src/lib/evals/test-cases.ts`
- **Database**: `data/evals.db`
- **Hooks**: `.claude/hooks/skill-*-hook.sh`
- **Schema**: `eval-schema.sql`

## Research Findings

From Anthropic docs:

> "At startup, the agent pre-loads the `name` and `description` of
> every installed skill into its system prompt."

**Skills activate through**:

1. Skill metadata (name + description) → system prompt
2. Claude matches user request → relevant skills
3. Claude calls `Skill('skill-name')` tool
4. Full SKILL.md loads (progressive disclosure)

**The forced-eval hook works because**: It forces explicit evaluation
of ALL skills before implementation, preventing Claude from jumping
straight to coding.

## Decision Needed

Should we:

- **Option A**: Fix API evals to replicate real-world conditions
  exactly
- **Option B**: Accept manual testing as ground truth, use API evals
  only for regression
- **Option C**: Build hybrid: API for fast iteration, manual for final
  validation

## Timeline

- ✅ Created skills for Svelte 5 runes, SvelteKit data-flow,
  structure, remote-functions
- ✅ Built eval system with database tracking
- ✅ Tested 4 hook configurations manually (40 tests)
- ✅ Identified forced-eval as most reliable
- 🔄 **CURRENT**: Need to make API evals match real-world results
- ⏳ **NEXT**: Automate testing at scale to validate hooks
  statistically
