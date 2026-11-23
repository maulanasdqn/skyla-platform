import { A, O } from "@mobily/ts-belt";
import { useMatchRoute, useRouterState } from "@tanstack/react-router";
import { navActiveTarget } from "../libs/nav/nav-active.ts";
import {
	navItemsOf,
	ROUTER_STATUS,
	type TNavGroup,
	type TNavItem,
} from "../constants/nav.ts";

type TNavTarget = NonNullable<TNavItem["to"]>;

export type TNavSelection = {
	isActive: (target: TNavItem["to"]) => boolean;
};

const navTargetsOf = (groups: readonly TNavGroup[]): readonly TNavTarget[] =>
	A.filterMap(
		navItemsOf(groups),
		(item): O.Option<TNavTarget> => O.fromNullable(item.to),
	);

export const useNavSelection = (
	groups: readonly TNavGroup[],
): TNavSelection => {
	const matchRoute = useMatchRoute();
	const isNavigating = useRouterState({
		select: (state): boolean => state.status === ROUTER_STATUS.PENDING,
	});

	const active = navActiveTarget(
		navTargetsOf(groups),
		(target): boolean =>
			!!matchRoute({ to: target, fuzzy: true, pending: isNavigating }),
	);

	return {
		isActive: (target: TNavItem["to"]): boolean =>
			active !== undefined && target === active,
	};
};
