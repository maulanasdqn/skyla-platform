import { CHAT_ROLE } from "@app/schemas";
import { describe, expect, it } from "vitest";
import {
	exchangeOf,
	turnOf,
	turnsToMessages,
} from "#/routes/_authenticated/chat/_utils/chat-turns.ts";
import { exchangeSettle } from "#/routes/_authenticated/chat/_utils/exchange-settle.ts";

describe("exchangeSettle", () => {
	it("leaves an answered exchange alone", (): void => {
		const turns = [
			turnOf(CHAT_ROLE.USER, "Hi"),
			turnOf(CHAT_ROLE.ASSISTANT, "Hello"),
		];
		expect(exchangeSettle(turns)).toBe(turns);
	});

	it("drops an unanswered exchange from what the next request sends", (): void => {
		const answered = [
			turnOf(CHAT_ROLE.USER, "Hi"),
			turnOf(CHAT_ROLE.ASSISTANT, "Hello"),
		];
		const settled = exchangeSettle([...answered, ...exchangeOf("Again?")]);
		expect(settled.map((turn) => turn.unanswered)).toEqual([
			false,
			false,
			true,
			true,
		]);
		expect(turnsToMessages([...settled, ...exchangeOf("Retry")])).toEqual([
			{ role: CHAT_ROLE.USER, content: "Hi" },
			{ role: CHAT_ROLE.ASSISTANT, content: "Hello" },
			{ role: CHAT_ROLE.USER, content: "Retry" },
		]);
	});
});
