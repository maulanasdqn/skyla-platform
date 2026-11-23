import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { match, P } from "ts-pattern";
import { EServerUnreachable } from "@app/shell/libs/auth/server-unreachable.ts";
import { SESSION_REACH } from "@app/shell/libs/auth/session-reach.ts";

const ChatShell: FC = (): ReactElement => <Outlet />;

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) => {
		match(context)
			.with({ reach: SESSION_REACH.UNREACHABLE }, () => {
				throw new EServerUnreachable();
			})
			.with({ session: P.nullish }, () => {
				throw redirect({ to: "/login", search: { redirect: location.href } });
			})
			.otherwise(() => undefined);
	},
	component: ChatShell,
});
