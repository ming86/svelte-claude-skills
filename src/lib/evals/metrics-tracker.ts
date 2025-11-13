/**
 * Performance metrics tracking for evaluation tests
 * Extracts token usage and calculates latency from Claude Agent SDK messages
 */

export interface TestMetrics {
	input_tokens: number;
	output_tokens: number;
	cache_creation_tokens: number;
	cache_read_tokens: number;
	thinking_tokens?: number; // For Claude Opus 4.1
	total_tokens: number;
	latency_ms: number;
	estimated_cost_usd: number;
}

export interface UsageData {
	input_tokens: number;
	output_tokens: number;
	cache_creation_tokens: number;
	cache_read_tokens: number;
	thinking_tokens?: number;
}

/**
 * Extract usage data from Claude Agent SDK message stream
 * Accumulates token counts across all assistant messages
 */
export async function extract_usage_from_messages(
	messages: AsyncIterable<any>,
	start_time: number,
): Promise<{ usage: UsageData; latency_ms: number }> {
	const usage: UsageData = {
		input_tokens: 0,
		output_tokens: 0,
		cache_creation_tokens: 0,
		cache_read_tokens: 0,
		thinking_tokens: 0,
	};

	for await (const message of messages) {
		if (message.type === 'assistant' && message.message?.usage) {
			const msg_usage = message.message.usage;
			usage.input_tokens += msg_usage.input_tokens || 0;
			usage.output_tokens += msg_usage.output_tokens || 0;
			usage.cache_creation_tokens +=
				msg_usage.cache_creation_input_tokens || 0;
			usage.cache_read_tokens +=
				msg_usage.cache_read_input_tokens || 0;

			// Extended thinking tokens for Claude 4.1 models
			if (msg_usage.thinking_tokens) {
				usage.thinking_tokens =
					(usage.thinking_tokens || 0) + msg_usage.thinking_tokens;
			}
		}
	}

	const latency_ms = Date.now() - start_time;

	return { usage, latency_ms };
}

/**
 * Calculate total token count
 */
export function calculate_total_tokens(usage: UsageData): number {
	return (
		usage.input_tokens +
		usage.output_tokens +
		usage.cache_creation_tokens +
		usage.cache_read_tokens +
		(usage.thinking_tokens || 0)
	);
}
