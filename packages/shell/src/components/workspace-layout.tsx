import { Separator } from "@app/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@app/components/ui/sidebar";
import { Outlet } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import type { TNavGroup } from "../constants/nav.ts";
import { AppSidebar } from "./app-sidebar.tsx";
import { PageTransition } from "./page-transition.tsx";
import { RouteProgress } from "./route-progress.tsx";

type TWorkspaceLayoutProps = {
	navGroups: readonly TNavGroup[];
};

export const WorkspaceLayout: FC<TWorkspaceLayoutProps> = (
	props,
): ReactElement => (
	<SidebarProvider>
		<AppSidebar navGroups={props.navGroups} />
		<SidebarInset>
			<header className="relative flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 !h-4" />
				<RouteProgress />
			</header>
			<div className="min-w-0 flex-1 overflow-y-auto p-6">
				<div className="mx-auto w-full max-w-7xl">
					<PageTransition>
						<Outlet />
					</PageTransition>
				</div>
			</div>
		</SidebarInset>
	</SidebarProvider>
);
