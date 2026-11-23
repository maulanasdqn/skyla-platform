export const API_PORT = 3108;
export const API_URL = `http://127.0.0.1:${API_PORT}`;

const appsRoot = new URL("../..", import.meta.url).pathname;

export const SPA_DIST_ENV = {
	WEB_DIST_PATH: `${appsRoot}web/dist`,
	DASHBOARD_DIST_PATH: `${appsRoot}dashboard/dist`,
	ADMIN_DIST_PATH: `${appsRoot}admin/dist`,
} as const;
