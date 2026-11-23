import { CHAT_MESSAGE } from "@app/messages";
import { Effect, Stream } from "effect";
import type {
	TInferenceEvent,
	TInferenceEventStream,
} from "#/chat/domain/inference.ts";
import { inferenceEventWireSchema } from "#/chat/infrastructure/inference-wire.ts";
import { EInferenceUnavailable } from "#/shared/errors.ts";

const BLANK = "";

export const inferenceUnavailable = (cause: unknown): EInferenceUnavailable =>
	new EInferenceUnavailable({
		message: CHAT_MESSAGE.INFERENCE_UNAVAILABLE,
		cause,
	});

const lineDecode = (
	line: string,
): Effect.Effect<TInferenceEvent, EInferenceUnavailable> =>
	Effect.try({
		try: (): TInferenceEvent =>
			inferenceEventWireSchema.parse(JSON.parse(line)),
		catch: inferenceUnavailable,
	});

export const inferenceEventsOf = (
	bytes: Stream.Stream<Uint8Array, EInferenceUnavailable>,
): TInferenceEventStream =>
	bytes.pipe(
		Stream.decodeText,
		Stream.splitLines,
		Stream.filter((line: string): boolean => line.trim() !== BLANK),
		Stream.mapEffect(lineDecode),
	);
