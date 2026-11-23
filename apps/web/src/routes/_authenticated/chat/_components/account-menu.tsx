import { Guard } from "@app/components/guard/guard";
import { Button } from "@app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@app/components/ui/dropdown-menu";
import { adminPathOf, dashboardPathOf } from "@app/contract";
import { AUTH_MESSAGE, CHAT_SCREEN_MESSAGE, NAV_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { CircleUser, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import type { FC, ReactElement } from "react";
import { ConfirmDialog } from "@app/shell/components/confirm-dialog.tsx";
import { APP_PATH } from "@app/shell/constants/app-path.ts";
import { useSignOutConfirm } from "@app/shell/hooks/use-sign-out-confirm.ts";
import { useSession } from "@app/shell/libs/auth/use-session.ts";

export const AccountMenu: FC = (): ReactElement => {
	const session = useSession();
	const signOutConfirm = useSignOutConfirm();

	return (
		<>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						aria-label={CHAT_SCREEN_MESSAGE.ACCOUNT_MENU}
					>
						<CircleUser />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<div className="truncate px-2 py-1.5 text-xs text-muted-foreground">
						{session?.user.email}
					</div>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<a href={dashboardPathOf(APP_PATH.HOME)}>
							<LayoutDashboard />
							{NAV_MESSAGE.DASHBOARD}
						</a>
					</DropdownMenuItem>
					<Guard permissions={[PERMISSION.USER_READ]}>
						<DropdownMenuItem asChild>
							<a href={adminPathOf(APP_PATH.HOME)}>
								<ShieldCheck />
								{NAV_MESSAGE.ADMIN}
							</a>
						</DropdownMenuItem>
					</Guard>
					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={() => signOutConfirm.request()}>
						<LogOut />
						{NAV_MESSAGE.SIGN_OUT}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<ConfirmDialog
				open={signOutConfirm.open}
				title={AUTH_MESSAGE.SIGN_OUT_CONFIRM_TITLE}
				description={AUTH_MESSAGE.SIGN_OUT_CONFIRM_DESCRIPTION}
				confirmLabel={NAV_MESSAGE.SIGN_OUT}
				destructive
				onOpenChange={signOutConfirm.onOpenChange}
				onConfirm={signOutConfirm.onConfirm}
			/>
		</>
	);
};
