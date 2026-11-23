import { AUTH_MESSAGE } from "@app/messages";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "../libs/auth/client.ts";
import { sessionClear } from "../libs/auth/session-store.ts";
import { signOutPerform } from "../libs/auth/sign-out.ts";
import { documentNavigate } from "../libs/auth/document-navigate.ts";
import { webPathOf } from "@app/contract";
import { APP_PATH } from "../constants/app-path.ts";

export const useSessionSignOut = (): (() => Promise<void>) => {
	const queryClient = useQueryClient();

	return (): Promise<void> =>
		signOutPerform({
			signOut: () => authClient.signOut(),
			queryClient,
			onSignedOut: (): void => {
				sessionClear();
				void documentNavigate(webPathOf(APP_PATH.LOGIN));
			},
			onFailure: (): void => {
				toast.error(AUTH_MESSAGE.SIGN_OUT_FAILED);
			},
		});
};
