import { USER_DASHBOARD_MESSAGE } from "@app/messages";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { PageTitle } from "@app/shell/components/page-title.tsx";
import { PlaceholderCard } from "#/routes/_authenticated/overview/_components/placeholder-card.tsx";

const ApiKeysPage: FC = (): ReactElement => (
	<div className="flex flex-col gap-6">
		<PageTitle info={USER_DASHBOARD_MESSAGE.API_KEYS_INFO}>
			{USER_DASHBOARD_MESSAGE.API_KEYS_TITLE}
		</PageTitle>
		<PlaceholderCard
			title={USER_DASHBOARD_MESSAGE.API_KEYS_TITLE}
			info={USER_DASHBOARD_MESSAGE.API_KEYS_INFO}
			empty={USER_DASHBOARD_MESSAGE.API_KEYS_EMPTY}
		/>
	</div>
);

export const Route = createFileRoute("/_authenticated/api-keys/")({
	component: ApiKeysPage,
});
