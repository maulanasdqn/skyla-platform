import type { TPermission } from "@app/permissions";
import { A } from "@mobily/ts-belt";
import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export const NAV_ACTIVE_LAYOUT_ID = "nav-active-indicator";
export const NAV_HOVER_LAYOUT_ID = "nav-hover-indicator";

export const ROUTER_STATUS = {
	PENDING: "pending",
	IDLE: "idle",
} as const;

export type TNavItem = {
	to: LinkProps["to"];
	label: string;
	permissions: readonly TPermission[];
	icon: LucideIcon;
};

export type TNavGroup = {
	label: string;
	items: readonly TNavItem[];
};

export const navItemsOf = (groups: readonly TNavGroup[]): readonly TNavItem[] =>
	A.flat(A.map(groups, (group): readonly TNavItem[] => group.items));
