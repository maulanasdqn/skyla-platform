import type { TChatModelList } from "@app/schemas";
import { Effect } from "effect";
import type { EInferenceUnavailable } from "#/shared/errors.ts";
import {
	InferenceClient,
	type TInferenceClientId,
} from "#/chat/domain/inference.ts";
import { toChatModelListDto } from "#/chat/application/to-chat-model-dto.ts";

export const chatModelList = Effect.fn("chatModelList")(
	function* (): Effect.fn.Return<
		TChatModelList,
		EInferenceUnavailable,
		TInferenceClientId
	> {
		const client = yield* InferenceClient;
		const catalog = yield* client.models();
		return toChatModelListDto(catalog);
	},
);
