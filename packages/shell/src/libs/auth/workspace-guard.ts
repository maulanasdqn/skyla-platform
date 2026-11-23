import type { TMe } from "@app/schemas";
import { match, P } from "ts-pattern";
import { documentNavigate, signInPathOf } from "./document-navigate.ts";
import { EServerUnreachable } from "./server-unreachable.ts";
import { SESSION_REACH, type TSessionReach } from "./session-reach.ts";

type TWorkspaceGuardInput = {
	context: { reach: TSessionReach; session: TMe | null };
	location: { href: string };
};

export const workspaceGuard =
	(basePath: string): ((input: TWorkspaceGuardInput) => Promise<void>) =>
	async (input): Promise<void> =>
		match(input.context)
			.with({ reach: SESSION_REACH.UNREACHABLE }, (): never => {
				throw new EServerUnreachable();
			})
			.with(
				{ session: P.nullish },
				(): Promise<never> =>
					documentNavigate(signInPathOf(`${basePath}${input.location.href}`)),
			)
			.otherwise(async (): Promise<void> => undefined);
