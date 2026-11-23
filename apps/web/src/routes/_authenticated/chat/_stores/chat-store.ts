import type { TChatDoneEvent, TChatRole } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { Store } from "@tanstack/store";
import { exchangeSettle } from "#/routes/_authenticated/chat/_utils/exchange-settle.ts";

export type TChatTurn = {
	id: string;
	role: TChatRole;
	content: string;
	thinking: string;
	stats: TChatDoneEvent | null;
	unanswered: boolean;
};

export type TChatState = {
	turns: readonly TChatTurn[];
	streaming: boolean;
	error: string | null;
	model: string | null;
};

const EMPTY: TChatState = {
	turns: [],
	streaming: false,
	error: null,
	model: null,
};

export const chatStore = new Store<TChatState>(EMPTY);

export const chatReset = (): void =>
	chatStore.setState((state) => ({ ...EMPTY, model: state.model }));

export const chatModelSet = (model: string): void =>
	chatStore.setState((state) => ({ ...state, model }));

export const chatStreamStart = (turns: readonly TChatTurn[]): void =>
	chatStore.setState((state) => ({
		...state,
		turns: A.concat(state.turns, turns),
		streaming: true,
		error: null,
	}));

export const chatStreamEnd = (error: string | null): void =>
	chatStore.setState((state) => ({
		...state,
		turns: exchangeSettle(state.turns),
		streaming: false,
		error,
	}));

export const chatLastTurnUpdate = (
	update: (turn: TChatTurn) => TChatTurn,
): void =>
	chatStore.setState((state) => ({
		...state,
		turns: A.mapWithIndex(
			state.turns,
			(index, turn): TChatTurn =>
				index === state.turns.length - 1 ? update(turn) : turn,
		),
	}));
