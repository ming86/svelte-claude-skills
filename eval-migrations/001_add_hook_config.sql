-- Add hook_config field to test_runs to track which hook was used
-- This allows comparing effectiveness of different hook strategies

ALTER TABLE test_runs ADD COLUMN hook_config TEXT CHECK(
  hook_config IS NULL OR
  hook_config IN ('none', 'simple', 'llm-eval', 'forced')
);

-- Create index for querying by hook config
CREATE INDEX IF NOT EXISTS idx_test_runs_hook_config ON test_runs(hook_config);
