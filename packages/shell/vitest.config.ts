import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [viteReact()],
	test: {
		environment: "jsdom",
		globals: false,
		setupFiles: ["./src/vitest.setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		coverage: {
			provider: "v8",
			thresholds: { lines: 90, statements: 90, functions: 90, branches: 75 },
			exclude: [
				"src/components/**",
				"src/hooks/**",
				"src/constants/**",
				"src/libs/orpc/client.ts",
				"src/libs/auth/client.ts",
			],
		},
	},
});
