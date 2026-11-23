import type { TChatMessage } from "@app/schemas";
import { Context, type Effect, type Stream } from "effect";
import type { EInferenceUnavailable } from "#/shared/errors.ts";
import { REPO_TAG } from "#/shared/repo-tags.ts";
import type { TServiceId } from "#/shared/service-id.ts";

export const INFERENCE_EVENT_TYPE = {
	STARTED: "started",
	LOADING: "loading",
	TOKEN: "token",
	DONE: "done",
	ERROR: "error",
} as const;

export type TInferenceModel = {
	id: string;
	name: string;
	arch: string;
	size_gb: number;
	supported: boolean;
};

export type TInferenceCatalog = {
	models: readonly TInferenceModel[];
	loaded: string | null;
};

export type TInferenceSettings = {
	temperature: number;
	top_k: number;
	top_p: number;
	max_tokens: number;
	system: null;
};

export type TInferenceChatRequest = {
	model: string | null;
	messages: readonly TChatMessage[];
	settings: TInferenceSettings;
};

export type TInferenceStats = {
	prompt_tokens: number;
	prefill_ms: number;
	tokens: number;
	tokens_per_second: number;
	position: number;
	context: number;
};

export type TInferenceEvent =
	| { type: typeof INFERENCE_EVENT_TYPE.STARTED }
	| { type: typeof INFERENCE_EVENT_TYPE.LOADING; id: string }
	| { type: typeof INFERENCE_EVENT_TYPE.TOKEN; text: string; thinking: boolean }
	| ({ type: typeof INFERENCE_EVENT_TYPE.DONE } & TInferenceStats)
	| { type: typeof INFERENCE_EVENT_TYPE.ERROR; message: string };

export type TInferenceEventStream = Stream.Stream<
	TInferenceEvent,
	EInferenceUnavailable
>;

export type TInferenceClient = {
	models: () => Effect.Effect<TInferenceCatalog, EInferenceUnavailable>;
	chat: (
		request: TInferenceChatRequest,
	) => Effect.Effect<TInferenceEventStream, EInferenceUnavailable>;
};

export type TInferenceClientId = TServiceId<typeof REPO_TAG.INFERENCE_CLIENT>;

export const InferenceClient = Context.Service<
	TInferenceClientId,
	TInferenceClient
>(REPO_TAG.INFERENCE_CLIENT);
