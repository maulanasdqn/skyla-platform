import { z } from "zod";

export const CHAT_EVENT_TYPE = {
	TOKEN: "token",
	DONE: "done",
} as const;

export type TChatEventType =
	(typeof CHAT_EVENT_TYPE)[keyof typeof CHAT_EVENT_TYPE];

export const chatTokenEventSchema = z.object({
	type: z.literal(CHAT_EVENT_TYPE.TOKEN),
	text: z.string(),
	thinking: z.boolean(),
});
export type TChatTokenEvent = z.infer<typeof chatTokenEventSchema>;

export const chatDoneEventSchema = z.object({
	type: z.literal(CHAT_EVENT_TYPE.DONE),
	promptTokens: z.number().int().nonnegative(),
	completionTokens: z.number().int().nonnegative(),
	tokensPerSecond: z.number().nonnegative(),
	contextUsed: z.number().int().nonnegative(),
	contextSize: z.number().int().nonnegative(),
});
export type TChatDoneEvent = z.infer<typeof chatDoneEventSchema>;

export const chatEventSchema = z.discriminatedUnion("type", [
	chatTokenEventSchema,
	chatDoneEventSchema,
]);
export type TChatEvent = z.infer<typeof chatEventSchema>;
