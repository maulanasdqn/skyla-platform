import { describe, expect, it } from "vitest";
import {
	ADMIN_BASE_PATH,
	adminPathOf,
	DASHBOARD_BASE_PATH,
	dashboardPathOf,
	WEB_BASE_PATH,
	webPathOf,
} from "./web-paths.ts";

describe("webPathOf", () => {
	it("places a web route under the base path the SPA is served from", (): void => {
		expect(webPathOf("/reset-password")).toBe(
			`${WEB_BASE_PATH}/reset-password`,
		);
	});

	it("keeps the query string of the route it is given", (): void => {
		expect(webPathOf("/reset-password?invite=true")).toBe(
			`${WEB_BASE_PATH}/reset-password?invite=true`,
		);
	});
});

describe("dashboardPathOf and adminPathOf", () => {
	it("place a route under the base path of the app that owns it", (): void => {
		expect(dashboardPathOf("/account")).toBe(`${DASHBOARD_BASE_PATH}/account`);
		expect(adminPathOf("/users")).toBe(`${ADMIN_BASE_PATH}/users`);
	});
});
