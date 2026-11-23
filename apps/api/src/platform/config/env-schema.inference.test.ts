import { describe, expect, it } from "vitest";
import { envSchema, NODE_ENV } from "#/platform/config/env-schema.ts";
import {
	ENV,
	METRICS_TOKEN,
} from "#/platform/config/env-schema-fakes.test-support.ts";
import {
	INFERENCE_URL_DEFAULT,
	inferenceUrlOf,
} from "#/platform/config/inference-env-rules.ts";

const BLANK = "";
const INFERENCE_TOKEN = "service-token";

describe("envSchema inference", () => {
	it("refuses to start in production without an inference service address", () => {
		const { INFERENCE_URL: _omitted, ...withoutInference } = ENV;

		expect(
			envSchema.safeParse({
				...withoutInference,
				NODE_ENV: NODE_ENV.PRODUCTION,
				METRICS_TOKEN,
			}).success,
		).toBe(false);
	});

	it("falls back to the local service outside production", () => {
		const parsed = envSchema.parse({ ...ENV, INFERENCE_URL: BLANK });

		expect(inferenceUrlOf(parsed)).toBe(INFERENCE_URL_DEFAULT);
	});

	it("keeps the configured address and token", () => {
		const parsed = envSchema.parse({ ...ENV, INFERENCE_TOKEN });

		expect(inferenceUrlOf(parsed)).toBe(ENV.INFERENCE_URL);
		expect(parsed.INFERENCE_TOKEN).toBe(INFERENCE_TOKEN);
	});

	it("rejects an address that is not a URL", () => {
		expect(
			envSchema.safeParse({ ...ENV, INFERENCE_URL: "not a url" }).success,
		).toBe(false);
	});
});
