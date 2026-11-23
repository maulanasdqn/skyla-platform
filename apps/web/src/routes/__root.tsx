import type { TPermission } from "@app/permissions";
import type { TMe } from "@app/schemas";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import type { TSessionReach } from "@app/shell/libs/auth/session-reach.ts";
import { NotFoundScreen } from "@app/shell/components/not-found-screen.tsx";
import { RouteErrorScreen } from "@app/shell/components/route-error-screen.tsx";

type TRouterContext = {
	queryClient: QueryClient;
	reach: TSessionReach;
	session: TMe | null;
	permissions: readonly TPermission[];
};

const RootLayout: FC = (): ReactElement => <Outlet />;

export const Route = createRootRouteWithContext<TRouterContext>()({
	component: RootLayout,
	errorComponent: RouteErrorScreen,
	notFoundComponent: NotFoundScreen,
});
