export const WEB_BASE_PATH = "/app";
export const DASHBOARD_BASE_PATH = "/dashboard";
export const ADMIN_BASE_PATH = "/admin";

export const SPA_BASE_PATHS = [
	WEB_BASE_PATH,
	DASHBOARD_BASE_PATH,
	ADMIN_BASE_PATH,
] as const;

export type TSpaBasePath = (typeof SPA_BASE_PATHS)[number];

export const SPA_DEV_PORT = {
	[WEB_BASE_PATH]: 5173,
	[DASHBOARD_BASE_PATH]: 5174,
	[ADMIN_BASE_PATH]: 5175,
} as const satisfies Record<TSpaBasePath, number>;

export const webPathOf = (path: string): string => `${WEB_BASE_PATH}${path}`;

export const dashboardPathOf = (path: string): string =>
	`${DASHBOARD_BASE_PATH}${path}`;

export const adminPathOf = (path: string): string =>
	`${ADMIN_BASE_PATH}${path}`;
