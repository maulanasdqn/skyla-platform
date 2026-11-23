import {
	MOTION_FOLLOW,
	MOTION_GLIDE,
} from "@app/components/motion/motion-tokens";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@app/components/ui/sidebar";
import { A } from "@mobily/ts-belt";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { FC, ReactElement } from "react";
import {
	NAV_ACTIVE_LAYOUT_ID,
	NAV_HOVER_LAYOUT_ID,
	type TNavGroup,
} from "../constants/nav.ts";
import { useNavGroups } from "../hooks/use-nav-groups.ts";
import { useNavHover, type TNavHover } from "../hooks/use-nav-hover.ts";
import {
	type TNavSelection,
	useNavSelection,
} from "../hooks/use-nav-selection.ts";

type TNavGroupMenuProps = {
	group: TNavGroup;
	selection: TNavSelection;
	hover: TNavHover;
};

const NavGroupMenu: FC<TNavGroupMenuProps> = (props): ReactElement => {
	return (
		<SidebarMenu
			onMouseLeave={props.hover.onLeave}
			onBlur={props.hover.onBlurWithin}
		>
			{A.map(props.group.items, (item) => {
				const isActive = props.selection.isActive(item.to);
				return (
					<SidebarMenuItem
						key={item.to}
						onMouseEnter={() => props.hover.onEnter(item.to)}
						onFocus={() => props.hover.onEnter(item.to)}
					>
						{props.hover.target === item.to && (
							<motion.span
								layoutId={NAV_HOVER_LAYOUT_ID}
								className="absolute inset-0 z-0 rounded-md bg-sidebar-accent/50"
								initial={false}
								animate={{ opacity: props.hover.visible ? 1 : 0 }}
								transition={MOTION_FOLLOW}
							/>
						)}
						{isActive && (
							<motion.span
								layoutId={NAV_ACTIVE_LAYOUT_ID}
								className="absolute inset-0 z-0 rounded-md bg-sidebar-accent shadow-sm"
								transition={MOTION_GLIDE}
							/>
						)}
						<SidebarMenuButton
							asChild
							tooltip={item.label}
							isActive={isActive}
							className="relative z-10 transition-[width,height,padding,color] duration-300 hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent"
						>
							<Link to={item.to}>
								<item.icon />
								<span>{item.label}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
};

type TAppSidebarNavProps = {
	groups: readonly TNavGroup[];
};

export const AppSidebarNav: FC<TAppSidebarNavProps> = (props): ReactElement => {
	const groups = useNavGroups(props.groups);
	const selection = useNavSelection(props.groups);
	const hover = useNavHover();

	return (
		<>
			{A.map(groups, (group) => (
				<SidebarGroup key={group.label}>
					<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
					<SidebarGroupContent>
						<NavGroupMenu group={group} selection={selection} hover={hover} />
					</SidebarGroupContent>
				</SidebarGroup>
			))}
		</>
	);
};
