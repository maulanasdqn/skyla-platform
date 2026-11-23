import { Effect, Layer, Stream } from "effect";
import { match, P } from "ts-pattern";
import {
	InferenceClient,
	type TInferenceCatalog,
	type TInferenceClient,
	type TInferenceEventStream,
} from "#/chat/domain/inference.ts";
import {
	inferenceEventsOf,
	inferenceUnavailable,
} from "#/chat/infrastructure/inference-ndjson.ts";
import { inferenceCatalogWireSchema } from "#/chat/infrastructure/inference-wire.ts";
import { env } from "#/platform/config/env.ts";
import { inferenceUrlOf } from "#/platform/config/inference-env-rules.ts";

const INFERENCE_PATH = {
	MODELS: "/v1/models",
	CHAT: "/v1/chat",
} as const;

const HEADER = {
	AUTHORIZATION: "Authorization",
	CONTENT_TYPE: "Content-Type",
} as const;

const JSON_CONTENT_TYPE = "application/json";
const BEARER_PREFIX = "Bearer ";
const METHOD_POST = "POST";
const STATUS_FAILURE = "inference service answered with status";

const headersOf = (token: string | undefined): Record<string, string> =>
	match(token)
		.with(
			P.string,
			(found): Record<string, string> => ({
				[HEADER.CONTENT_TYPE]: JSON_CONTENT_TYPE,
				[HEADER.AUTHORIZATION]: `${BEARER_PREFIX}${found}`,
			}),
		)
		.otherwise(
			(): Record<string, string> => ({
				[HEADER.CONTENT_TYPE]: JSON_CONTENT_TYPE,
			}),
		);

const okBodyOf = (response: Response): ReadableStream<Uint8Array> =>
	match(response)
		.with(
			{ ok: true, body: P.nonNullable },
			(found): ReadableStream<Uint8Array> => found.body,
		)
		.otherwise((found): never => {
			throw new Error(`${STATUS_FAILURE} ${found.status}`);
		});

const eventsOf = (
	response: Response,
	controller: AbortController,
): TInferenceEventStream =>
	inferenceEventsOf(
		Stream.fromReadableStream({
			evaluate: (): ReadableStream<Uint8Array> => okBodyOf(response),
			onError: inferenceUnavailable,
		}),
	).pipe(Stream.ensuring(Effect.sync((): void => controller.abort())));

export const inferenceClientOf = (
	baseUrl: string,
	token: string | undefined,
	fetcher: typeof fetch,
): TInferenceClient => {
	const models: TInferenceClient["models"] = () =>
		Effect.tryPromise({
			try: async (signal): Promise<TInferenceCatalog> => {
				const response = await fetcher(`${baseUrl}${INFERENCE_PATH.MODELS}`, {
					headers: headersOf(token),
					signal,
				});
				okBodyOf(response);
				return inferenceCatalogWireSchema.parse(await response.json());
			},
			catch: inferenceUnavailable,
		});

	const chat: TInferenceClient["chat"] = (request) => {
		const controller = new AbortController();
		return Effect.tryPromise({
			try: async (): Promise<TInferenceEventStream> => {
				const response = await fetcher(`${baseUrl}${INFERENCE_PATH.CHAT}`, {
					method: METHOD_POST,
					headers: headersOf(token),
					body: JSON.stringify(request),
					signal: controller.signal,
				});
				okBodyOf(response);
				return eventsOf(response, controller);
			},
			catch: inferenceUnavailable,
		}).pipe(
			Effect.onInterrupt(
				(): Effect.Effect<void> => Effect.sync((): void => controller.abort()),
			),
		);
	};

	return { models, chat };
};

export const inferenceClientLayer = Layer.effect(
	InferenceClient,
	Effect.sync(() =>
		InferenceClient.of(
			inferenceClientOf(inferenceUrlOf(env), env.INFERENCE_TOKEN, fetch),
		),
	),
);
