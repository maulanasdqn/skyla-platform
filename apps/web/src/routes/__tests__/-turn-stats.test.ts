import { CHAT_EVENT_TYPE } from "@app/schemas";
import { describe, expect, it } from "vitest";
import { turnStatsLabel } from "#/routes/_authenticated/chat/_utils/turn-stats.ts";

describe("turnStatsLabel", () => {
	it("shows tokens, speed and context use on one line", (): void => {
		expect(
			turnStatsLabel({
				type: CHAT_EVENT_TYPE.DONE,
				promptTokens: 12,
				completionTokens: 30,
				tokensPerSecond: 41.56,
				contextUsed: 42,
				contextSize: 16384,
			}),
		).toBe("30 tokens · 41.6 tok/s · context 42/16384");
	});
});
