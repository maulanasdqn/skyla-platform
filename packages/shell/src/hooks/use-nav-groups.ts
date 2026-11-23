import { usePermissions } from "@app/components/guard/use-permissions";
import { A } from "@mobily/ts-belt";
import type { TNavGroup, TNavItem } from "../constants/nav.ts";

export const useNavGroups = (
	groups: readonly TNavGroup[],
): readonly TNavGroup[] => {
	const { canAll } = usePermissions();

	return A.filter(
		A.map(
			groups,
			(group): TNavGroup => ({
				label: group.label,
				items: A.filter(group.items, (item: TNavItem): boolean =>
					canAll(item.permissions),
				),
			}),
		),
		(group): boolean => A.isNotEmpty(group.items),
	);
};
