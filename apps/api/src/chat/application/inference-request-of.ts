import type { TChatStreamInput } from "@app/schemas";
import type { TInferenceChatRequest } from "#/chat/domain/inference.ts";

export const CHAT_DEFAULT = {
	TEMPERATURE: 0.6,
	TOP_K: 40,
	TOP_P: 0.95,
	MAX_TOKENS: 4096,
} as const;

export const inferenceRequestOf = (
	input: TChatStreamInput,
): TInferenceChatRequest => ({
	model: input.model ?? null,
	messages: input.messages,
	settings: {
		temperature: input.temperature ?? CHAT_DEFAULT.TEMPERATURE,
		top_k: CHAT_DEFAULT.TOP_K,
		top_p: input.topP ?? CHAT_DEFAULT.TOP_P,
		max_tokens: input.maxTokens ?? CHAT_DEFAULT.MAX_TOKENS,
		system: null,
	},
});
