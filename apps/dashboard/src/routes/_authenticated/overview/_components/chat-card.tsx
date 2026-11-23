import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardHeader } from "@app/components/ui/card";
import { CardHeading } from "@app/components/ui/card-heading";
import { webPathOf } from "@app/contract";
import { USER_DASHBOARD_MESSAGE } from "@app/messages";
import { APP_PATH } from "@app/shell/constants/app-path.ts";
import { MessageSquare } from "lucide-react";
import type { FC, ReactElement } from "react";

export const ChatCard: FC = (): ReactElement => (
	<Card>
		<CardHeader>
			<CardHeading info={USER_DASHBOARD_MESSAGE.CHAT_INFO}>
				{USER_DASHBOARD_MESSAGE.CHAT_TITLE}
			</CardHeading>
		</CardHeader>
		<CardContent>
			<Button asChild>
				<a href={webPathOf(APP_PATH.CHAT)}>
					<MessageSquare />
					{USER_DASHBOARD_MESSAGE.CHAT_OPEN}
				</a>
			</Button>
		</CardContent>
	</Card>
);
