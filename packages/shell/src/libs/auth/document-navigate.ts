import { webPathOf } from "@app/contract";
import { APP_PATH } from "../../constants/app-path.ts";

const REDIRECT_PARAM = "redirect";

export const documentNavigate = (href: string): Promise<never> => {
	window.location.assign(href);
	return new Promise<never>((): void => undefined);
};

export const signInPathOf = (returnTo: string): string =>
	`${webPathOf(APP_PATH.LOGIN)}?${new URLSearchParams({ [REDIRECT_PARAM]: returnTo })}`;
