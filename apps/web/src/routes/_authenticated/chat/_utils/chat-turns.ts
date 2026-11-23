import {
	CHAT_EVENT_TYPE,
	CHAT_ROLE,
	type TChatEvent,
	type TChatMessage,
	type TChatRole,
} from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { match } from "ts-pattern";
import type { TChatTurn } from "#/routes/_authenticated/chat/_stores/chat-store.ts";

export const turnOf = (role: TChatRole, content: string): TChatTurn => ({
	id: crypto.randomUUID(),
	role,
	content,
	thinking: "",
	stats: null,
	unanswered: false,
});

export const turnsToMessages = (
	turns: readonly TChatTurn[],
): readonly TChatMessage[] =>
	A.map(
		A.filter(
			turns,
			(turn): boolean => !turn.unanswered && turn.content.trim() !== "",
		),
		(turn): TChatMessage => ({ role: turn.role, content: turn.content }),
	);

export const turnApply = (turn: TChatTurn, event: TChatEvent): TChatTurn =>
	match(event)
		.with({ type: CHAT_EVENT_TYPE.TOKEN, thinking: true }, (token) => ({
			...turn,
			thinking: `${turn.thinking}${token.text}`,
		}))
		.with({ type: CHAT_EVENT_TYPE.TOKEN, thinking: false }, (token) => ({
			...turn,
			content: `${turn.content}${token.text}`,
		}))
		.with({ type: CHAT_EVENT_TYPE.DONE }, (done) => ({ ...turn, stats: done }))
		.exhaustive();

export const exchangeOf = (text: string): readonly TChatTurn[] => [
	turnOf(CHAT_ROLE.USER, text),
	turnOf(CHAT_ROLE.ASSISTANT, ""),
];
