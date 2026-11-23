import { A } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import type { TChatTurn } from "#/routes/_authenticated/chat/_stores/chat-store.ts";

const EXCHANGE_SIZE = 2;

export const exchangeSettle = (
	turns: readonly TChatTurn[],
): readonly TChatTurn[] =>
	match(A.last(turns))
		.with({ content: P.when((content) => content.trim() === "") }, () =>
			A.mapWithIndex(
				turns,
				(index, turn): TChatTurn =>
					index >= turns.length - EXCHANGE_SIZE
						? { ...turn, unanswered: true }
						: turn,
			),
		)
		.otherwise((): readonly TChatTurn[] => turns);
