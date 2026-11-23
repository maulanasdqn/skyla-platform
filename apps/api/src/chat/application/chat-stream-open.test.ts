import { CHAT_EVENT_TYPE, CHAT_ROLE } from "@app/schemas";
import { Effect, Stream } from "effect";
import { describe, expect, it, vi } from "vitest";
import { chatStreamOpen } from "#/chat/application/chat-stream-open.ts";
import {
	EVENTS,
	inferenceLayerOf,
	STATS,
} from "#/chat/application/chat-fakes.test-support.ts";
import { CHAT_DEFAULT } from "#/chat/application/inference-request-of.ts";
import {
	INFERENCE_EVENT_TYPE,
	type TInferenceClient,
} from "#/chat/domain/inference.ts";
import { ERROR_TAG } from "#/shared/error-tags.ts";

const MESSAGES = [
	{ role: CHAT_ROLE.SYSTEM, content: "Be brief." },
	{ role: CHAT_ROLE.USER, content: "Hi" },
];

const collect = (
	layer: ReturnType<typeof inferenceLayerOf>,
): Promise<unknown> =>
	Effect.runPromise(
		chatStreamOpen({ messages: MESSAGES }).pipe(
			Effect.flatMap(Stream.runCollect),
			Effect.provide(layer),
		),
	);

describe("chatStreamOpen", () => {
	it("sends the defaults the client left out and the messages as given", async (): Promise<void> => {
		const chat = vi.fn<TInferenceClient["chat"]>(() =>
			Effect.succeed(Stream.fromIterable(EVENTS)),
		);

		await collect(inferenceLayerOf({ chat }));

		expect(chat).toHaveBeenCalledWith({
			model: null,
			messages: MESSAGES,
			settings: {
				temperature: CHAT_DEFAULT.TEMPERATURE,
				top_k: CHAT_DEFAULT.TOP_K,
				top_p: CHAT_DEFAULT.TOP_P,
				max_tokens: CHAT_DEFAULT.MAX_TOKENS,
				system: null,
			},
		});
	});

	it("forwards the model and sampling the client chose", async (): Promise<void> => {
		const chat = vi.fn<TInferenceClient["chat"]>(() =>
			Effect.succeed(Stream.fromIterable(EVENTS)),
		);
		const layer = inferenceLayerOf({ chat });

		await Effect.runPromise(
			chatStreamOpen({
				model: "qwen3-4b",
				messages: MESSAGES,
				temperature: 0,
				topP: 0.5,
				maxTokens: 64,
			}).pipe(Effect.flatMap(Stream.runCollect), Effect.provide(layer)),
		);

		expect(chat.mock.calls[0]?.[0]).toMatchObject({
			model: "qwen3-4b",
			settings: { temperature: 0, top_p: 0.5, max_tokens: 64 },
		});
	});

	it("drops lifecycle lines and maps tokens and stats to the public events", async (): Promise<void> => {
		const events = await collect(inferenceLayerOf({}));

		expect(events).toEqual([
			{ type: CHAT_EVENT_TYPE.TOKEN, text: "Hel", thinking: true },
			{ type: CHAT_EVENT_TYPE.TOKEN, text: "lo", thinking: false },
			{
				type: CHAT_EVENT_TYPE.DONE,
				promptTokens: STATS.prompt_tokens,
				completionTokens: STATS.tokens,
				tokensPerSecond: STATS.tokens_per_second,
				contextUsed: STATS.position,
				contextSize: STATS.context,
			},
		]);
	});

	it("turns an error line from the service into the inference failure", async (): Promise<void> => {
		const chat = vi.fn<TInferenceClient["chat"]>(() =>
			Effect.succeed(
				Stream.fromIterable([
					{ type: INFERENCE_EVENT_TYPE.TOKEN, text: "a", thinking: false },
					{ type: INFERENCE_EVENT_TYPE.ERROR, message: "context full" },
				] as const),
			),
		);

		await expect(collect(inferenceLayerOf({ chat }))).rejects.toMatchObject({
			_tag: ERROR_TAG.INFERENCE_UNAVAILABLE,
		});
	});
});
