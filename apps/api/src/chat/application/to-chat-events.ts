import { CHAT_MESSAGE } from "@app/messages";
import { CHAT_EVENT_TYPE, type TChatEvent } from "@app/schemas";
import { Stream } from "effect";
import { match } from "ts-pattern";
import {
	INFERENCE_EVENT_TYPE,
	type TInferenceEvent,
	type TInferenceEventStream,
} from "#/chat/domain/inference.ts";
import { EInferenceUnavailable } from "#/shared/errors.ts";

type TChatEventStream = Stream.Stream<TChatEvent, EInferenceUnavailable>;

const chatEventsOfOne = (event: TInferenceEvent): TChatEventStream =>
	match(event)
		.with(
			{ type: INFERENCE_EVENT_TYPE.STARTED },
			{ type: INFERENCE_EVENT_TYPE.LOADING },
			(): TChatEventStream => Stream.empty,
		)
		.with(
			{ type: INFERENCE_EVENT_TYPE.TOKEN },
			(token): TChatEventStream =>
				Stream.succeed({
					type: CHAT_EVENT_TYPE.TOKEN,
					text: token.text,
					thinking: token.thinking,
				}),
		)
		.with(
			{ type: INFERENCE_EVENT_TYPE.DONE },
			(done): TChatEventStream =>
				Stream.succeed({
					type: CHAT_EVENT_TYPE.DONE,
					promptTokens: done.prompt_tokens,
					completionTokens: done.tokens,
					tokensPerSecond: done.tokens_per_second,
					contextUsed: done.position,
					contextSize: done.context,
				}),
		)
		.with(
			{ type: INFERENCE_EVENT_TYPE.ERROR },
			(failure): TChatEventStream =>
				Stream.fail(
					new EInferenceUnavailable({
						message: CHAT_MESSAGE.INFERENCE_FAILED,
						cause: failure.message,
					}),
				),
		)
		.exhaustive();

export const toChatEvents = (events: TInferenceEventStream): TChatEventStream =>
	Stream.flatMap(events, chatEventsOfOne);
