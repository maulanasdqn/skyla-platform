import { Effect, Layer, Stream } from "effect";
import {
	INFERENCE_EVENT_TYPE,
	InferenceClient,
	type TInferenceCatalog,
	type TInferenceClient,
	type TInferenceEvent,
} from "#/chat/domain/inference.ts";

export const CATALOG: TInferenceCatalog = {
	models: [
		{
			id: "qwen3-4b",
			name: "Qwen3 4B",
			arch: "qwen3",
			size_gb: 2.3,
			supported: true,
		},
		{
			id: "gemma",
			name: "Gemma",
			arch: "gemma3",
			size_gb: 1.1,
			supported: false,
		},
	],
	loaded: "qwen3-4b",
};

export const STATS = {
	prompt_tokens: 12,
	prefill_ms: 40.5,
	tokens: 3,
	tokens_per_second: 27.5,
	position: 15,
	context: 4096,
} as const;

export const EVENTS: readonly TInferenceEvent[] = [
	{ type: INFERENCE_EVENT_TYPE.STARTED },
	{ type: INFERENCE_EVENT_TYPE.LOADING, id: "qwen3-4b" },
	{ type: INFERENCE_EVENT_TYPE.TOKEN, text: "Hel", thinking: true },
	{ type: INFERENCE_EVENT_TYPE.TOKEN, text: "lo", thinking: false },
	{ type: INFERENCE_EVENT_TYPE.DONE, ...STATS },
];

export const inferenceLayerOf = (
	client: Partial<TInferenceClient>,
): Layer.Layer<typeof InferenceClient.Identifier> =>
	Layer.succeed(
		InferenceClient,
		InferenceClient.of({
			models:
				client.models ??
				((): Effect.Effect<TInferenceCatalog> => Effect.succeed(CATALOG)),
			chat:
				client.chat ??
				((): ReturnType<TInferenceClient["chat"]> =>
					Effect.succeed(Stream.fromIterable(EVENTS))),
		}),
	);
