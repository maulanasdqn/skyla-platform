import { z } from "zod";

export const CHAT_LIMIT = {
	CONTENT_MAX: 32_000,
	MESSAGES_MAX: 200,
	TEMPERATURE_MAX: 2,
	TOP_P_MAX: 1,
	MAX_TOKENS_MAX: 8192,
} as const;

export const CHAT_ROLE = {
	SYSTEM: "system",
	USER: "user",
	ASSISTANT: "assistant",
} as const;

export type TChatRole = (typeof CHAT_ROLE)[keyof typeof CHAT_ROLE];

export const chatRoleSchema = z.enum([
	CHAT_ROLE.SYSTEM,
	CHAT_ROLE.USER,
	CHAT_ROLE.ASSISTANT,
]);

export const chatMessageSchema = z.object({
	role: chatRoleSchema,
	content: z.string().min(1).max(CHAT_LIMIT.CONTENT_MAX),
});
export type TChatMessage = z.infer<typeof chatMessageSchema>;

export const chatStreamInputSchema = z.object({
	model: z.string().min(1).optional(),
	messages: z.array(chatMessageSchema).min(1).max(CHAT_LIMIT.MESSAGES_MAX),
	temperature: z.number().min(0).max(CHAT_LIMIT.TEMPERATURE_MAX).optional(),
	topP: z.number().min(0).max(CHAT_LIMIT.TOP_P_MAX).optional(),
	maxTokens: z.number().int().min(1).max(CHAT_LIMIT.MAX_TOKENS_MAX).optional(),
});
export type TChatStreamInput = z.infer<typeof chatStreamInputSchema>;

export const chatModelSchema = z.object({
	id: z.string(),
	name: z.string(),
	architecture: z.string(),
	sizeGb: z.number(),
	supported: z.boolean(),
	loaded: z.boolean(),
});
export type TChatModel = z.infer<typeof chatModelSchema>;

export const chatModelListSchema = z.object({
	models: z.array(chatModelSchema),
});
export type TChatModelList = z.infer<typeof chatModelListSchema>;
