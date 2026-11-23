import { ADMIN_BASE_PATH, DASHBOARD_BASE_PATH } from "@app/contract";
import { A } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";

const PATH_PREFIX = "/";
const PROTOCOL_RELATIVE_PREFIX = "//";
const BACKSLASH = "\\";
const OTHER_APP_BASE_PATHS = [DASHBOARD_BASE_PATH, ADMIN_BASE_PATH] as const;

export const RETURN_TO_DEFAULT = "/chat";

const isLocalPath = (value: string): boolean =>
	value.startsWith(PATH_PREFIX) &&
	!value.startsWith(PROTOCOL_RELATIVE_PREFIX) &&
	!value.includes(BACKSLASH);

export const returnToResolve = (requested: string | undefined): string =>
	match(requested)
		.with(P.string.select(), (found): string =>
			isLocalPath(found) ? found : RETURN_TO_DEFAULT,
		)
		.otherwise((): string => RETURN_TO_DEFAULT);

export const returnToLeavesApp = (resolved: string): boolean =>
	A.some(
		OTHER_APP_BASE_PATHS,
		(base): boolean =>
			resolved === base || resolved.startsWith(`${base}${PATH_PREFIX}`),
	);
