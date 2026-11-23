import type { FC, ReactElement } from "react";
import { APP_MESSAGE } from "@app/messages";
import { ConfirmDialog } from "./confirm-dialog.tsx";
import { RowActionsMenu } from "./row-actions-menu.tsx";
import type { TRowAction } from "../constants/row-action.ts";
import type { TConfirmedAction } from "../hooks/use-confirmed-action.ts";

type TRowActionsCellProps = {
	actions: readonly TRowAction[];
	confirm: TConfirmedAction<void>;
	confirmTitle: string;
	confirmDescription: string;
};

export const RowActionsCell: FC<TRowActionsCellProps> = (
	props,
): ReactElement => (
	<>
		<RowActionsMenu actions={props.actions} />
		<ConfirmDialog
			open={props.confirm.open}
			title={props.confirmTitle}
			description={props.confirmDescription}
			confirmLabel={APP_MESSAGE.DELETE}
			destructive
			onOpenChange={props.confirm.onOpenChange}
			onConfirm={props.confirm.onConfirm}
		/>
	</>
);
