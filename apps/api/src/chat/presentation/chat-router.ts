import { PERMISSION } from "@app/permissions";
import { chatModelList } from "#/chat/application/chat-model-list.ts";
import { chatStreamOpen } from "#/chat/application/chat-stream-open.ts";
import { implementer, permissionGuarded } from "#/platform/orpc/implementer.ts";
import { effectRun } from "#/platform/orpc/run-effect.ts";
import { streamRun } from "#/platform/orpc/run-stream.ts";

const chatRouter = implementer.chat.router({
	models: permissionGuarded(PERMISSION.CHAT_USE).chat.models.handler(
		({ context }) => effectRun(context.runtime, chatModelList()),
	),

	stream: permissionGuarded(PERMISSION.CHAT_USE).chat.stream.handler(
		({ input, context }) => streamRun(context.runtime, chatStreamOpen(input)),
	),
});

export type TChatRouter = typeof chatRouter;

export const chatRouterBuild = (): TChatRouter => chatRouter;
