import type { UseNavigateResult } from "@tanstack/react-router";
import { match } from "ts-pattern";
import { documentNavigate } from "@app/shell/libs/auth/document-navigate.ts";
import {
	returnToLeavesApp,
	returnToResolve,
} from "@app/shell/libs/auth/return-to.ts";

export const returnToOpen = async (
	navigate: UseNavigateResult<string>,
	requested: string | undefined,
): Promise<void> => {
	const resolved = returnToResolve(requested);
	return match(returnToLeavesApp(resolved))
		.with(true, (): Promise<never> => documentNavigate(resolved))
		.otherwise((): Promise<void> => navigate({ href: resolved }));
};
