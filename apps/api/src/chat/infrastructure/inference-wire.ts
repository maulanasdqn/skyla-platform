import { z } from "zod";
import { INFERENCE_EVENT_TYPE } from "#/chat/domain/inference.ts";

export const inferenceModelWireSchema = z.object({
	id: z.string(),
	name: z.string(),
	arch: z.string(),
	size_gb: z.number(),
	supported: z.boolean(),
});

export const inferenceCatalogWireSchema = z.object({
	models: z.array(inferenceModelWireSchema),
	loaded: z.string().nullable(),
});

export const inferenceEventWireSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal(INFERENCE_EVENT_TYPE.STARTED) }),
	z.object({ type: z.literal(INFERENCE_EVENT_TYPE.LOADING), id: z.string() }),
	z.object({
		type: z.literal(INFERENCE_EVENT_TYPE.TOKEN),
		text: z.string(),
		thinking: z.boolean(),
	}),
	z.object({
		type: z.literal(INFERENCE_EVENT_TYPE.DONE),
		prompt_tokens: z.number().int().nonnegative(),
		prefill_ms: z.number().nonnegative(),
		tokens: z.number().int().nonnegative(),
		tokens_per_second: z.number().nonnegative(),
		position: z.number().int().nonnegative(),
		context: z.number().int().nonnegative(),
	}),
	z.object({
		type: z.literal(INFERENCE_EVENT_TYPE.ERROR),
		message: z.string(),
	}),
]);
