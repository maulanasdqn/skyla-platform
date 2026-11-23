import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { SPA_BASE_PATHS, SPA_DEV_PORT, type TSpaBasePath } from "@app/contract";
import { A, D } from "@mobily/ts-belt";
import viteReact from "@vitejs/plugin-react";
import {
	defineConfig,
	loadEnv,
	type Plugin,
	type ProxyOptions,
	type UserConfigFnObject,
} from "vite";
import { THEME, THEME_STORAGE_KEY } from "../libs/theme/theme.ts";

const DEFAULT_API_URL = "http://localhost:3001";
const ALL_ENV_PREFIXES = "";
const LOCALHOST = "http://localhost";
const API_PROXY_PATHS = ["/api", "/rpc"] as const;

const THEME_PLACEHOLDER = {
	STORAGE_KEY: "__THEME_STORAGE_KEY__",
	LIGHT: "__THEME_LIGHT__",
} as const;

const themeScriptPlugin = (): Plugin => ({
	name: "theme-script-constants",
	transformIndexHtml: (html: string): string =>
		html
			.replaceAll(THEME_PLACEHOLDER.STORAGE_KEY, THEME_STORAGE_KEY)
			.replaceAll(THEME_PLACEHOLDER.LIGHT, THEME.LIGHT),
});

const proxyOf = (
	basePath: TSpaBasePath,
	apiUrl: string,
): Record<string, ProxyOptions> => {
	const api = A.map(API_PROXY_PATHS, (path): [string, ProxyOptions] => [
		path,
		{ target: apiUrl, changeOrigin: true },
	]);
	const siblings = A.map(
		A.reject(SPA_BASE_PATHS, (other): boolean => other === basePath),
		(other): [string, ProxyOptions] => [
			other,
			{ target: `${LOCALHOST}:${SPA_DEV_PORT[other]}`, ws: true },
		],
	);
	return D.fromPairs(A.concat(api, siblings));
};

export const spaViteConfig = (basePath: TSpaBasePath): UserConfigFnObject =>
	defineConfig(({ mode }) => {
		const fileEnv = loadEnv(mode, process.cwd(), ALL_ENV_PREFIXES);
		const apiUrl =
			process.env.VITE_API_URL || fileEnv.VITE_API_URL || DEFAULT_API_URL;

		return {
			base: `${basePath}/`,
			resolve: { tsconfigPaths: true },
			plugins: [
				tailwindcss(),
				tanstackRouter({
					target: "react",
					autoCodeSplitting: true,
					routesDirectory: "./src/routes",
					generatedRouteTree: "./src/routeTree.gen.ts",
					routeFileIgnorePattern:
						"^(_apis|_components|_data|_hooks|_constants|_stores|_utils)",
				}),
				viteReact(),
				themeScriptPlugin(),
			],
			server: {
				port: SPA_DEV_PORT[basePath],
				strictPort: true,
				proxy: proxyOf(basePath, apiUrl),
			},
		};
	});
