import { Button } from "@app/components/ui/button";
import { APP_MESSAGE, CHAT_SCREEN_MESSAGE } from "@app/messages";
import { SquarePen } from "lucide-react";
import type { FC, ReactElement } from "react";
import { BrandMark } from "@app/shell/components/brand-mark.tsx";
import type { TChatModels } from "#/routes/_authenticated/chat/_hooks/use-chat-models.ts";
import { AccountMenu } from "#/routes/_authenticated/chat/_components/account-menu.tsx";
import { ModelSelect } from "#/routes/_authenticated/chat/_components/model-select.tsx";

type TChatHeaderProps = {
	models: TChatModels;
	streaming: boolean;
	onNewChat: () => void;
};

export const ChatHeader: FC<TChatHeaderProps> = (props): ReactElement => (
	<header className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
		<BrandMark className="size-7" />
		<span className="hidden font-medium sm:inline">{APP_MESSAGE.NAME}</span>
		<ModelSelect models={props.models} disabled={props.streaming} />
		<div className="ml-auto flex items-center gap-1">
			<Button variant="ghost" size="sm" onClick={props.onNewChat}>
				<SquarePen />
				{CHAT_SCREEN_MESSAGE.NEW_CHAT}
			</Button>
			<AccountMenu />
		</div>
	</header>
);
