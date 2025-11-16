# Hook Effectiveness Testing

This guide explains how to test different hook configurations to
measure skill activation rates.

## Quick Start

### Option 1: Web UI (Recommended)

1. Visit `/hooks-testing` in your browser
2. Configure test settings (prompt, iterations, hook label)
3. Click "Run Tests" to see **real-time results** as each test
   completes
4. View historical data and hook effectiveness comparisons

### Option 2: CLI Script

For programmatic testing or CI/CD:

```bash
cd scripts
export ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
node test-hooks.js --hook-config forced --iterations 10
```

## Setup

1. **Set your Anthropic API key** (to track costs separately from
   Claude Code):

   ```bash
   export ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```

2. **Configure the hook** you want to test in `.claude/settings.json`:
   ```json
   {
   	"hooks": {
   		"UserPromptSubmit": [
   			{
   				"hooks": [
   					{
   						"type": "command",
   						"command": ".claude/hooks/skill-forced-eval-hook.sh"
   					}
   				]
   			}
   		]
   	}
   }
   ```

## CLI Usage

### Basic usage

Test with default prompt (10 iterations):

```bash
node run-hook-test.js --hook-config forced
```

### Custom prompt and iterations

```bash
node run-hook-test.js \
  --prompt "Create a new route at /posts/new with a form" \
  --iterations 20 \
  --hook-config forced
```

### Specify expected skills

```bash
node run-hook-test.js \
  --prompt "Add reactive state to track user clicks" \
  --iterations 10 \
  --hook-config simple \
  --expected-skills svelte5-runes
```

## Parameters

| Parameter           | Description                                         | Default                        |
| ------------------- | --------------------------------------------------- | ------------------------------ |
| `--prompt`          | The prompt to test                                  | SvelteKit form creation prompt |
| `--iterations`      | Number of test runs                                 | 10                             |
| `--hook-config`     | Hook type: `none`, `simple`, `llm-eval`, `forced`   | `none`                         |
| `--expected-skills` | Comma-separated list of skills that should activate | (any)                          |
| `--model`           | Claude model to use                                 | `claude-sonnet-4-5-20250929`   |
| `--db`              | Path to SQLite database                             | `./data/evals.db`              |

## Hook Configuration Types

### 1. No hook (`none`)

Remove or comment out the `hooks` section in `.claude/settings.json`:

```json
{}
```

### 2. Simple instruction (`simple`)

```json
{
	"hooks": {
		"UserPromptSubmit": [
			{
				"hooks": [
					{
						"type": "command",
						"command": ".claude/hooks/skill-simple-instruction-hook.sh"
					}
				]
			}
		]
	}
}
```

### 3. LLM eval (`llm-eval`)

```json
{
	"hooks": {
		"UserPromptSubmit": [
			{
				"hooks": [
					{
						"type": "command",
						"command": ".claude/hooks/skill-llm-eval-hook.sh"
					}
				]
			}
		]
	}
}
```

### 4. Forced eval (`forced`)

```json
{
	"hooks": {
		"UserPromptSubmit": [
			{
				"hooks": [
					{
						"type": "command",
						"command": ".claude/hooks/skill-forced-eval-hook.sh"
					}
				]
			}
		]
	}
}
```

## Testing Workflow

1. **Test baseline** (no hooks):

   ```bash
   # Update .claude/settings.json to remove hooks
   node run-hook-test.js --hook-config none --iterations 10
   ```

2. **Test simple instruction**:

   ```bash
   # Update .claude/settings.json to use simple hook
   node run-hook-test.js --hook-config simple --iterations 10
   ```

3. **Test LLM eval**:

   ```bash
   # Update .claude/settings.json to use llm-eval hook
   node run-hook-test.js --hook-config llm-eval --iterations 10
   ```

4. **Test forced eval**:

   ```bash
   # Update .claude/settings.json to use forced hook
   node run-hook-test.js --hook-config forced --iterations 10
   ```

5. **View comparison**:
   ```bash
   # Query database to see hook effectiveness
   sqlite3 data/evals.db "SELECT * FROM v_hook_effectiveness"
   ```

## Output

The script will:

- Run N iterations of the same prompt
- Track which skills were activated each time
- Calculate activation rate (passed/total)
- Store results in `data/evals.db`
- Show cost and performance metrics
- Compare to previous runs with same hook config

Example output:

```
📊 RESULTS SUMMARY
======================================================================

✅ Passed: 10/10 (100.0%)
❌ Failed: 0/10

💰 Cost Analysis:
   Total cost: $0.1234
   Avg per test: $0.0123

⏱️  Performance:
   Total time: 45.2s
   Avg per test: 4.52s

🎯 Skills Activation:
   sveltekit-data-flow: 10/10 (100%)
   svelte5-runes: 10/10 (100%)
   sveltekit-structure: 9/10 (90%)

💾 Results saved to database
   Run ID: 123e4567-e89b-12d3-a456-426614174000
```

## Database Queries

### View all runs for a hook type

```sql
SELECT
  run_timestamp,
  total_tests,
  passed_tests,
  CAST(passed_tests AS REAL) / total_tests * 100 as pass_rate,
  total_cost_usd
FROM test_runs
WHERE hook_config = 'forced'
ORDER BY run_timestamp DESC;
```

### Compare hook effectiveness

```sql
SELECT * FROM v_hook_effectiveness;
```

### View individual test results

```sql
SELECT
  test_id,
  expected_skill,
  activated_skill,
  passed,
  latency_ms
FROM activation_results
WHERE run_id = 'your-run-id-here';
```
