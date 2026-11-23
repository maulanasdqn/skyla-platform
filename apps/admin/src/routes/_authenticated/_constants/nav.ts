import { NAV_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import type { TNavGroup, TNavItem } from "@app/shell/constants/nav.ts";
import {
	Activity,
	KeyRound,
	LayoutDashboard,
	Mail,
	Shield,
	StickyNote,
	Users,
} from "lucide-react";

const WORKSPACE_ITEMS: readonly TNavItem[] = [
	{
		to: "/overview",
		label: NAV_MESSAGE.OVERVIEW,
		permissions: [],
		icon: LayoutDashboard,
	},
	{
		to: "/notes",
		label: NAV_MESSAGE.NOTES,
		permissions: [PERMISSION.NOTE_READ],
		icon: StickyNote,
	},
];

const ADMINISTRATION_ITEMS: readonly TNavItem[] = [
	{
		to: "/users",
		label: NAV_MESSAGE.USERS,
		permissions: [PERMISSION.USER_READ, PERMISSION.ROLE_READ],
		icon: Users,
	},
	{
		to: "/roles",
		label: NAV_MESSAGE.ROLES,
		permissions: [PERMISSION.ROLE_READ],
		icon: Shield,
	},
	{
		to: "/permissions",
		label: NAV_MESSAGE.PERMISSIONS,
		permissions: [PERMISSION.ROLE_READ],
		icon: KeyRound,
	},
	{
		to: "/activity",
		label: NAV_MESSAGE.ACTIVITY,
		permissions: [PERMISSION.ACTIVITY_READ],
		icon: Activity,
	},
	{
		to: "/subscribers",
		label: NAV_MESSAGE.SUBSCRIBERS,
		permissions: [PERMISSION.NEWSLETTER_READ],
		icon: Mail,
	},
];

export const NAV_GROUPS: readonly TNavGroup[] = [
	{ label: NAV_MESSAGE.GROUP_WORKSPACE, items: WORKSPACE_ITEMS },
	{ label: NAV_MESSAGE.GROUP_ADMINISTRATION, items: ADMINISTRATION_ITEMS },
];
