import {
	serverErrorStoreCreate,
	type TServerErrorStore,
} from "@app/shell/libs/forms/server-error-store.ts";

export const loginError: TServerErrorStore = serverErrorStoreCreate();
