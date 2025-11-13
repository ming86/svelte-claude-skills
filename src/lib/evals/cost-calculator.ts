/**
 * Cost calculator for Claude API usage
 * Pricing as of January 2025 (per million tokens)
 */

import type { UsageData } from './metrics-tracker';

interface ModelPricing {
	input: number;
	output: number;
	cache_write: number;
	cache_read: number;
	thinking?: number; // For extended thinking models
}

// Pricing per million tokens (USD)
const PRICING_TABLE: Record<string, ModelPricing> = {
	// Claude Sonnet 4.5
	'claude-sonnet-4-5-20250929': {
		input: 5.0,
		output: 25.0,
		cache_write: 7.5,
		cache_read: 0.5,
	},

	// Claude Haiku 4.5
	'claude-haiku-4-5-20251001': {
		input: 1.0,
		output: 5.0,
		cache_write: 1.5,
		cache_read: 0.1,
	},

	// Claude Opus 4.1 (with extended thinking)
	'claude-opus-4-1-20250805': {
		input: 20.0,
		output: 80.0,
		thinking: 40.0,
		cache_write: 30.0,
		cache_read: 2.0,
	},
};

// Default to Sonnet 4.5 if model not found
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

/**
 * Calculate API cost for given usage and model
 */
export function calculate_cost(
	usage: UsageData,
	model: string,
): number {
	const pricing =
		PRICING_TABLE[model] || PRICING_TABLE[DEFAULT_MODEL];

	const input_cost = (usage.input_tokens / 1_000_000) * pricing.input;
	const output_cost =
		(usage.output_tokens / 1_000_000) * pricing.output;
	const cache_write_cost =
		(usage.cache_creation_tokens / 1_000_000) * pricing.cache_write;
	const cache_read_cost =
		(usage.cache_read_tokens / 1_000_000) * pricing.cache_read;

	const thinking_cost =
		usage.thinking_tokens && pricing.thinking
			? (usage.thinking_tokens / 1_000_000) * pricing.thinking
			: 0;

	return (
		input_cost +
		output_cost +
		cache_write_cost +
		cache_read_cost +
		thinking_cost
	);
}

/**
 * Get detailed cost breakdown
 */
export function get_cost_breakdown(
	usage: UsageData,
	model: string,
): {
	total: number;
	input: number;
	output: number;
	cache_write: number;
	cache_read: number;
	thinking?: number;
} {
	const pricing =
		PRICING_TABLE[model] || PRICING_TABLE[DEFAULT_MODEL];

	const input = (usage.input_tokens / 1_000_000) * pricing.input;
	const output = (usage.output_tokens / 1_000_000) * pricing.output;
	const cache_write =
		(usage.cache_creation_tokens / 1_000_000) * pricing.cache_write;
	const cache_read =
		(usage.cache_read_tokens / 1_000_000) * pricing.cache_read;

	const thinking =
		usage.thinking_tokens && pricing.thinking
			? (usage.thinking_tokens / 1_000_000) * pricing.thinking
			: undefined;

	return {
		total:
			input + output + cache_write + cache_read + (thinking || 0),
		input,
		output,
		cache_write,
		cache_read,
		thinking,
	};
}

/**
 * Format cost as USD string
 */
export function format_cost(cost: number): string {
	if (cost < 0.01) {
		return `$${(cost * 100).toFixed(4)}¢`;
	}
	return `$${cost.toFixed(4)}`;
}

/**
 * Get pricing for a model
 */
export function get_model_pricing(model: string): ModelPricing {
	return PRICING_TABLE[model] || PRICING_TABLE[DEFAULT_MODEL];
}
