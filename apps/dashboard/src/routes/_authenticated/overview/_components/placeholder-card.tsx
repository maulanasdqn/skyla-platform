import { Card, CardContent, CardHeader } from "@app/components/ui/card";
import { CardHeading } from "@app/components/ui/card-heading";
import { EmptyState } from "@app/shell/components/empty-state.tsx";
import type { FC, ReactElement } from "react";

type TPlaceholderCardProps = {
	title: string;
	info: string;
	empty: string;
};

export const PlaceholderCard: FC<TPlaceholderCardProps> = (
	props,
): ReactElement => (
	<Card>
		<CardHeader>
			<CardHeading info={props.info}>{props.title}</CardHeading>
		</CardHeader>
		<CardContent>
			<EmptyState message={props.empty} />
		</CardContent>
	</Card>
);
