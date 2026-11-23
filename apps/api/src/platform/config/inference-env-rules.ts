import { match, P } from "ts-pattern";
import { z } from "zod";
import { blankAsUndefined } from "#/platform/config/env-parsers.ts";

export const INFERENCE_URL_DEFAULT = "http://127.0.0.1:8080";

const INFERENCE_ENV_KEY = {
	INFERENCE_URL: "INFERENCE_URL",
} as const;

const INFERENCE_ENV_MESSAGE = {
	URL_REQUIRED:
		"INFERENCE_URL is required in production, because the inference service runs separately from the api.",
} as const;

export const inferenceEnvShape = {
	INFERENCE_URL: z.preprocess(blankAsUndefined, z.url().optional()),
	INFERENCE_TOKEN: z.preprocess(blankAsUndefined, z.string().min(1).optional()),
};

type TInferenceEnv = {
	INFERENCE_URL?: string | undefined;
};

export const inferenceEnvRefine = (
	env: TInferenceEnv,
	context: z.RefinementCtx,
	production: boolean,
): void =>
	match({ production, url: env.INFERENCE_URL })
		.with({ production: true, url: P.nullish }, (): void => {
			context.addIssue({
				code: "custom",
				path: [INFERENCE_ENV_KEY.INFERENCE_URL],
				message: INFERENCE_ENV_MESSAGE.URL_REQUIRED,
			});
		})
		.otherwise((): void => undefined);

export const inferenceUrlOf = (env: TInferenceEnv): string =>
	env.INFERENCE_URL ?? INFERENCE_URL_DEFAULT;
