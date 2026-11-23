import type { TSpaBasePath } from "@app/contract";
import type { Hono } from "hono";
import { match, P } from "ts-pattern";
import { cachedStatic } from "#/platform/http/static-files.ts";

const SHELL_FILE = "index.html";

export const webDistMount = (
	app: Hono,
	basePath: TSpaBasePath,
	webDistPath: string | undefined,
): void => {
	const routes = `${basePath}/*`;
	const hashedAssetPrefix = `${basePath}/assets/`;
	const withoutBasePath = (requestPath: string): string =>
		requestPath.slice(basePath.length);

	match(webDistPath)
		.with(P.nullish, (): undefined => undefined)
		.otherwise((path): void => {
			app.use(
				routes,
				cachedStatic(
					{ root: path, rewriteRequestPath: withoutBasePath },
					hashedAssetPrefix,
				),
			);
			app.get(
				routes,
				cachedStatic({ path: `${path}/${SHELL_FILE}` }, hashedAssetPrefix),
			);
		});
};
