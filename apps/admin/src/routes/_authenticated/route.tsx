import { ADMIN_BASE_PATH } from "@app/contract";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { WorkspaceLayout } from "@app/shell/components/workspace-layout.tsx";
import { workspaceGuard } from "@app/shell/libs/auth/workspace-guard.ts";
import { NAV_GROUPS } from "#/routes/_authenticated/_constants/nav.ts";

const AdminLayout: FC = (): ReactElement => (
	<WorkspaceLayout navGroups={NAV_GROUPS} />
);

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: workspaceGuard(ADMIN_BASE_PATH),
	component: AdminLayout,
});
