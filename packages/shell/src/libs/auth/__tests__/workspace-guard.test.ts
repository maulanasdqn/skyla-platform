import { afterEach, describe, expect, it, vi } from "vitest";
import { EServerUnreachable } from "../server-unreachable.ts";
import { SESSION_REACH } from "../session-reach.ts";
import { workspaceGuard } from "../workspace-guard.ts";

const BASE_PATH = "/admin";
const LOCATION = { href: "/users?page=2" };

describe("workspaceGuard", () => {
	afterEach((): void => {
		vi.unstubAllGlobals();
	});

	it("lets a signed-in person through", async (): Promise<void> => {
		const session = { user: { id: "u" } } as never;
		await expect(
			workspaceGuard(BASE_PATH)({
				context: { reach: SESSION_REACH.REACHED, session },
				location: LOCATION,
			}),
		).resolves.toBeUndefined();
	});

	it("reports an unreachable server instead of sending anyone to sign in", async (): Promise<void> => {
		await expect(
			workspaceGuard(BASE_PATH)({
				context: { reach: SESSION_REACH.UNREACHABLE, session: null },
				location: LOCATION,
			}),
		).rejects.toBeInstanceOf(EServerUnreachable);
	});

	it("sends a signed-out person to the web sign-in with the full way back", (): void => {
		const assign = vi.fn();
		vi.stubGlobal("location", { assign });
		void workspaceGuard(BASE_PATH)({
			context: { reach: SESSION_REACH.REACHED, session: null },
			location: LOCATION,
		});
		expect(assign).toHaveBeenCalledWith(
			"/app/login?redirect=%2Fadmin%2Fusers%3Fpage%3D2",
		);
	});
});
