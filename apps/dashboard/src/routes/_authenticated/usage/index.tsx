import { USER_DASHBOARD_MESSAGE } from "@app/messages";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { PageTitle } from "@app/shell/components/page-title.tsx";
import { PlaceholderCard } from "#/routes/_authenticated/overview/_components/placeholder-card.tsx";

const UsagePage: FC = (): ReactElement => (
	<div className="flex flex-col gap-6">
		<PageTitle info={USER_DASHBOARD_MESSAGE.USAGE_INFO}>
			{USER_DASHBOARD_MESSAGE.USAGE_TITLE}
		</PageTitle>
		<PlaceholderCard
			title={USER_DASHBOARD_MESSAGE.USAGE_TITLE}
			info={USER_DASHBOARD_MESSAGE.USAGE_INFO}
			empty={USER_DASHBOARD_MESSAGE.USAGE_EMPTY}
		/>
	</div>
);

export const Route = createFileRoute("/_authenticated/usage/")({
	component: UsagePage,
});
