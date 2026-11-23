import { inferenceClientLayer } from "#/chat/infrastructure/inference-client.ts";
import { chatRouterBuild } from "#/chat/presentation/chat-router.ts";

export const chatModule: {
	layer: typeof inferenceClientLayer;
	routerBuild: typeof chatRouterBuild;
} = {
	layer: inferenceClientLayer,
	routerBuild: chatRouterBuild,
};
