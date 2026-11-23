import {
	type TConfirmedAction,
	useConfirmedAction,
} from "./use-confirmed-action.ts";

export const useRowDeleteConfirm = (
	remove: () => void,
): TConfirmedAction<void> => useConfirmedAction<void>(() => remove());
