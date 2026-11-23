import {
	chatEventSchema,
	chatModelListSchema,
	chatStreamInputSchema,
} from "@app/schemas";
import { eventIterator, oc } from "@orpc/contract";
import { HTTP_METHOD } from "./http-methods.ts";
import { ROUTE_PATH } from "./route-paths.ts";

export const chatContract = {
	models: oc
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.CHAT_MODELS })
		.output(chatModelListSchema),

	stream: oc
		.route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.CHAT_STREAM })
		.input(chatStreamInputSchema)
		.output(eventIterator(chatEventSchema)),
};
