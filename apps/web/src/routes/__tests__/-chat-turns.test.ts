import { CHAT_EVENT_TYPE, CHAT_ROLE } from "@app/schemas";
import { describe, expect, it } from "vitest";
import {
	exchangeOf,
	turnApply,
	turnOf,
	turnsToMessages,
} from "#/routes/_authenticated/chat/_utils/chat-turns.ts";

const DONE = {
	type: CHAT_EVENT_TYPE.DONE,
	promptTokens: 12,
	completionTokens: 30,
	tokensPerSecond: 41.5,
	contextUsed: 42,
	contextSize: 16384,
} as const;

describe("turnApply", () => {
	it("routes thinking tokens and answer tokens to their own text", (): void => {
		const thought = turnApply(turnOf(CHAT_ROLE.ASSISTANT, ""), {
			type: CHAT_EVENT_TYPE.TOKEN,
			text: "hmm",
			thinking: true,
		});
		const answered = turnApply(thought, {
			type: CHAT_EVENT_TYPE.TOKEN,
			text: "Paris",
			thinking: false,
		});
		expect(answered.thinking).toBe("hmm");
		expect(answered.content).toBe("Paris");
	});

	it("keeps the stats of the finished reply", (): void => {
		expect(turnApply(turnOf(CHAT_ROLE.ASSISTANT, "ok"), DONE).stats).toBe(DONE);
	});
});

describe("turnsToMessages", () => {
	it("sends the answers without their thinking and skips the empty reply", (): void => {
		const [user, reply] = exchangeOf("Capital of France?");
		const answered = { ...turnOf(CHAT_ROLE.ASSISTANT, "Paris"), thinking: "x" };
		expect(
			turnsToMessages([user, answered, ...exchangeOf("And Spain?")]),
		).toEqual([
			{ role: CHAT_ROLE.USER, content: "Capital of France?" },
			{ role: CHAT_ROLE.ASSISTANT, content: "Paris" },
			{ role: CHAT_ROLE.USER, content: "And Spain?" },
		]);
		expect(turnsToMessages([reply])).toEqual([]);
	});
});
