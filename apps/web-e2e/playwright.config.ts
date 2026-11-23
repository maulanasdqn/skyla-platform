import { defineConfig, devices } from "@playwright/test";
import { API_URL } from "./support/e2e-env.ts";

export default defineConfig({
	testDir: "./tests",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: "list",
	use: {
		baseURL: API_URL,
		trace: "on-first-retry",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	globalSetup: "./support/global-setup.ts",
	globalTeardown: "./support/global-teardown.ts",
});
