import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { match, P } from "ts-pattern";
import { EServerUnreachable } from "@app/shell/libs/auth/server-unreachable.ts";
import { SESSION_REACH } from "@app/shell/libs/auth/session-reach.ts";
import { PageTransition } from "@app/shell/components/page-transition.tsx";

const PublicLayout: FC = (): ReactElement => (
	<PageTransition>
		<Outlet />
	</PageTransition>
);

export const Route = createFileRoute("/_public")({
	beforeLoad: ({ context }) => {
		match(context)
			.with({ reach: SESSION_REACH.UNREACHABLE }, () => {
				throw new EServerUnreachable();
			})
			.with({ session: P.nullish }, () => undefined)
			.otherwise(() => {
				throw redirect({ to: "/chat" });
			});
	},
	component: PublicLayout,
});
