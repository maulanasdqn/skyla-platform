import type { TChatModel } from "@app/schemas";
import { A, O } from "@mobily/ts-belt";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { orpc } from "@app/shell/libs/orpc/client.ts";
import {
	chatModelSet,
	chatStore,
} from "#/routes/_authenticated/chat/_stores/chat-store.ts";

export type TChatModels = {
	models: readonly TChatModel[];
	isPending: boolean;
	selected: string | null;
	select: (id: string) => void;
};

const loadedIdOf = (models: readonly TChatModel[]): string | null =>
	O.toNullable(
		O.map(
			A.find(models, (model): boolean => model.loaded),
			(model): string => model.id,
		),
	);

export const useChatModels = (): TChatModels => {
	const query = useQuery(orpc.chat.models.queryOptions());
	const chosen = useSelector(chatStore, (state) => state.model);
	const models = query.data?.models ?? [];

	return {
		models,
		isPending: query.isPending,
		selected: chosen ?? loadedIdOf(models),
		select: chatModelSet,
	};
};
