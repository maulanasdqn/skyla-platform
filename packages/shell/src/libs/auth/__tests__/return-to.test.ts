import { describe, expect, it } from "vitest";
import {
	RETURN_TO_DEFAULT,
	returnToLeavesApp,
	returnToResolve,
} from "../return-to.ts";

describe("returnToResolve", () => {
	it("goes to the chat when nothing was requested", (): void => {
		expect(returnToResolve(undefined)).toBe(RETURN_TO_DEFAULT);
	});

	it("returns to a page inside the app, search included", (): void => {
		expect(returnToResolve("/notes?page=2")).toBe("/notes?page=2");
	});

	it("refuses to leave the app through an absolute or protocol-relative URL", (): void => {
		expect(returnToResolve("https://evil.test/")).toBe(RETURN_TO_DEFAULT);
		expect(returnToResolve("//evil.test/")).toBe(RETURN_TO_DEFAULT);
		expect(returnToResolve("/\\evil.test")).toBe(RETURN_TO_DEFAULT);
	});
});

describe("returnToLeavesApp", () => {
	it("is true for a page of the dashboard or the admin app", (): void => {
		expect(returnToLeavesApp("/dashboard")).toBe(true);
		expect(returnToLeavesApp("/admin/users?page=2")).toBe(true);
	});

	it("is false for a page of the web app, even one that starts alike", (): void => {
		expect(returnToLeavesApp("/chat")).toBe(false);
		expect(returnToLeavesApp("/administrator")).toBe(false);
	});
});
