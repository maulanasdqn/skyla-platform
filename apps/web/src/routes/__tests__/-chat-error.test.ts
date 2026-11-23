import { CHAT_MESSAGE } from "@app/messages";
import { ORPCError } from "@orpc/client";
import { describe, expect, it } from "vitest";
import { chatErrorMessage } from "#/routes/_authenticated/chat/_utils/chat-error.ts";

describe("chatErrorMessage", () => {
	it("says nothing when the person stopped the reply", (): void => {
		expect(chatErrorMessage(new DOMException("stop", "AbortError"))).toBeNull();
	});

	it("shows the server's reason when the model server is down", (): void => {
		const failure = new ORPCError("SERVICE_UNAVAILABLE", {
			message: CHAT_MESSAGE.INFERENCE_UNAVAILABLE,
		});
		expect(chatErrorMessage(failure)).toBe(CHAT_MESSAGE.INFERENCE_UNAVAILABLE);
	});

	it("falls back to a generic failure for anything else", (): void => {
		expect(chatErrorMessage(new ORPCError("FORBIDDEN"))).toBe(
			CHAT_MESSAGE.INFERENCE_FAILED,
		);
		expect(chatErrorMessage(new Error("boom"))).toBe(
			CHAT_MESSAGE.INFERENCE_FAILED,
		);
	});
});
