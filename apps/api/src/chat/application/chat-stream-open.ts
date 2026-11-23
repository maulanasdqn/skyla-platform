import type { TChatEvent, TChatStreamInput } from "@app/schemas";
import { Effect, type Stream } from "effect";
import type { EInferenceUnavailable } from "#/shared/errors.ts";
import {
	InferenceClient,
	type TInferenceClientId,
} from "#/chat/domain/inference.ts";
import { inferenceRequestOf } from "#/chat/application/inference-request-of.ts";
import { toChatEvents } from "#/chat/application/to-chat-events.ts";

export const chatStreamOpen = Effect.fn("chatStreamOpen")(function* (
	input: TChatStreamInput,
): Effect.fn.Return<
	Stream.Stream<TChatEvent, EInferenceUnavailable>,
	EInferenceUnavailable,
	TInferenceClientId
> {
	const client = yield* InferenceClient;
	const events = yield* client.chat(inferenceRequestOf(input));
	return toChatEvents(events);
});
