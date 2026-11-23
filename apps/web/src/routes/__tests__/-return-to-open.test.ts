import type { UseNavigateResult } from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RETURN_TO_DEFAULT } from "@app/shell/libs/auth/return-to.ts";
import { returnToOpen } from "#/routes/_public/_utils/return-to-open.ts";

const navigateMock = (): UseNavigateResult<string> =>
	vi.fn(async (): Promise<void> => undefined) as UseNavigateResult<string>;

describe("returnToOpen", () => {
	afterEach((): void => {
		vi.unstubAllGlobals();
	});

	it("navigates inside the web app for one of its own pages", async (): Promise<void> => {
		const navigate = navigateMock();
		await returnToOpen(navigate, "/chat?model=a");
		expect(navigate).toHaveBeenCalledWith({ href: "/chat?model=a" });
	});

	it("falls back to the chat when nothing safe was requested", async (): Promise<void> => {
		const navigate = navigateMock();
		await returnToOpen(navigate, "https://evil.test/");
		expect(navigate).toHaveBeenCalledWith({ href: RETURN_TO_DEFAULT });
	});

	it("loads the document of the app that owns a dashboard or admin page", (): void => {
		const assign = vi.fn();
		vi.stubGlobal("location", { assign });
		const navigate = navigateMock();
		void returnToOpen(navigate, "/admin/users");
		expect(assign).toHaveBeenCalledWith("/admin/users");
		expect(navigate).not.toHaveBeenCalled();
	});
});
