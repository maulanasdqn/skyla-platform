import { useSelector } from "@tanstack/react-store";
import { useRef } from "react";
import { client } from "@app/shell/libs/orpc/client.ts";
import {
	chatLastTurnUpdate,
	chatReset,
	chatStore,
	chatStreamEnd,
	chatStreamStart,
	type TChatTurn,
} from "#/routes/_authenticated/chat/_stores/chat-store.ts";
import { chatErrorMessage } from "#/routes/_authenticated/chat/_utils/chat-error.ts";
import {
	exchangeOf,
	turnApply,
	turnsToMessages,
} from "#/routes/_authenticated/chat/_utils/chat-turns.ts";

export type TChatSession = {
	turns: readonly TChatTurn[];
	streaming: boolean;
	error: string | null;
	send: (text: string) => Promise<void>;
	stop: () => void;
	reset: () => void;
};

const streamInto = async (
	model: string | null,
	turns: readonly TChatTurn[],
	signal: AbortSignal,
): Promise<void> => {
	const events = await client.chat.stream(
		{ model: model ?? undefined, messages: [...turnsToMessages(turns)] },
		{ signal },
	);
	for await (const event of events) {
		chatLastTurnUpdate((turn): TChatTurn => turnApply(turn, event));
	}
};

export const useChatSession = (): TChatSession => {
	const state = useSelector(chatStore, (current) => current);
	const controller = useRef<AbortController | null>(null);

	const send = async (text: string): Promise<void> => {
		const exchange = exchangeOf(text);
		const history = [...state.turns, ...exchange];
		const abort = new AbortController();
		controller.current = abort;
		chatStreamStart(exchange);
		try {
			await streamInto(state.model, history, abort.signal);
			chatStreamEnd(null);
		} catch (error) {
			chatStreamEnd(chatErrorMessage(error));
		}
	};

	return {
		turns: state.turns,
		streaming: state.streaming,
		error: state.error,
		send,
		stop: (): void => controller.current?.abort(),
		reset: (): void => {
			controller.current?.abort();
			chatReset();
		},
	};
};
