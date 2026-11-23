import { Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import { chatModelList } from "#/chat/application/chat-model-list.ts";
import {
	CATALOG,
	inferenceLayerOf,
} from "#/chat/application/chat-fakes.test-support.ts";
import { EInferenceUnavailable } from "#/shared/errors.ts";
import { ERROR_TAG } from "#/shared/error-tags.ts";

const UNAVAILABLE = new EInferenceUnavailable({
	message: "down",
	cause: "connection refused",
});

describe("chatModelList", () => {
	it("maps the service catalog to camelCase and marks the loaded model", async (): Promise<void> => {
		const result = await Effect.runPromise(
			chatModelList().pipe(Effect.provide(inferenceLayerOf({}))),
		);

		expect(result.models).toEqual([
			{
				id: CATALOG.models[0]?.id,
				name: CATALOG.models[0]?.name,
				architecture: CATALOG.models[0]?.arch,
				sizeGb: CATALOG.models[0]?.size_gb,
				supported: true,
				loaded: true,
			},
			{
				id: CATALOG.models[1]?.id,
				name: CATALOG.models[1]?.name,
				architecture: CATALOG.models[1]?.arch,
				sizeGb: CATALOG.models[1]?.size_gb,
				supported: false,
				loaded: false,
			},
		]);
	});

	it("marks no model loaded when the service has none in memory", async (): Promise<void> => {
		const layer = inferenceLayerOf({
			models: () => Effect.succeed({ ...CATALOG, loaded: null }),
		});

		const result = await Effect.runPromise(
			chatModelList().pipe(Effect.provide(layer)),
		);

		expect(result.models.some((model) => model.loaded)).toBe(false);
	});

	it("fails with the inference error when the service is down", async (): Promise<void> => {
		const layer = inferenceLayerOf({ models: () => Effect.fail(UNAVAILABLE) });

		const exit = await Effect.runPromiseExit(
			chatModelList().pipe(Effect.provide(layer)),
		);

		expect(Exit.isFailure(exit)).toBe(true);
		expect(JSON.stringify(exit)).toContain(ERROR_TAG.INFERENCE_UNAVAILABLE);
	});
});
