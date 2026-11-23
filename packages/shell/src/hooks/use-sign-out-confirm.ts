import {
	type TConfirmedAction,
	useConfirmedAction,
} from "./use-confirmed-action.ts";
import { useSessionSignOut } from "./use-session-sign-out.ts";

export const useSignOutConfirm = (): TConfirmedAction<void> => {
	const signOut = useSessionSignOut();
	return useConfirmedAction<void>((): void => void signOut());
};
