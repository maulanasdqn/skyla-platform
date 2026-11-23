import { USER_DASHBOARD_MESSAGE } from "@app/messages";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { PageTitle } from "@app/shell/components/page-title.tsx";
import { useSession } from "@app/shell/libs/auth/use-session.ts";
import { ChatCard } from "#/routes/_authenticated/overview/_components/chat-card.tsx";
import { PlaceholderCard } from "#/routes/_authenticated/overview/_components/placeholder-card.tsx";

const OverviewPage: FC = (): ReactElement => {
	const session = useSession();

	return (
		<div className="flex flex-col gap-6">
			<PageTitle>
				{USER_DASHBOARD_MESSAGE.GREETING}
				{session?.user.name ? `, ${session.user.name}` : ""}
			</PageTitle>
			<div className="grid gap-4 md:grid-cols-3">
				<ChatCard />
				<PlaceholderCard
					title={USER_DASHBOARD_MESSAGE.USAGE_TITLE}
					info={USER_DASHBOARD_MESSAGE.USAGE_INFO}
					empty={USER_DASHBOARD_MESSAGE.USAGE_EMPTY}
				/>
				<PlaceholderCard
					title={USER_DASHBOARD_MESSAGE.API_KEYS_TITLE}
					info={USER_DASHBOARD_MESSAGE.API_KEYS_INFO}
					empty={USER_DASHBOARD_MESSAGE.API_KEYS_EMPTY}
				/>
			</div>
		</div>
	);
};

export const Route = createFileRoute("/_authenticated/overview/")({
	component: OverviewPage,
});
