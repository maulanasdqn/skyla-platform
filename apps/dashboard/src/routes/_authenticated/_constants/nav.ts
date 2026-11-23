import { NAV_MESSAGE } from "@app/messages";
import type { TNavGroup } from "@app/shell/constants/nav.ts";
import { BarChart3, CircleUser, KeyRound, LayoutDashboard } from "lucide-react";

export const NAV_GROUPS: readonly TNavGroup[] = [
	{
		label: NAV_MESSAGE.GROUP_WORKSPACE,
		items: [
			{
				to: "/overview",
				label: NAV_MESSAGE.OVERVIEW,
				permissions: [],
				icon: LayoutDashboard,
			},
			{
				to: "/usage",
				label: NAV_MESSAGE.USAGE,
				permissions: [],
				icon: BarChart3,
			},
			{
				to: "/account",
				label: NAV_MESSAGE.ACCOUNT,
				permissions: [],
				icon: CircleUser,
			},
		],
	},
	{
		label: NAV_MESSAGE.GROUP_DEVELOPER,
		items: [
			{
				to: "/api-keys",
				label: NAV_MESSAGE.API_KEYS,
				permissions: [],
				icon: KeyRound,
			},
		],
	},
];
