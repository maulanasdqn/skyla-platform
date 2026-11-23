import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { ChatHeader } from "#/routes/_authenticated/chat/_components/chat-header.tsx";
import { Composer } from "#/routes/_authenticated/chat/_components/composer.tsx";
import { TurnList } from "#/routes/_authenticated/chat/_components/turn-list.tsx";
import { useChatModels } from "#/routes/_authenticated/chat/_hooks/use-chat-models.ts";
import { useChatSession } from "#/routes/_authenticated/chat/_hooks/use-chat-session.ts";

const ChatPage: FC = (): ReactElement => {
	const session = useChatSession();
	const models = useChatModels();

	return (
		<div className="flex h-dvh flex-col">
			<ChatHeader
				models={models}
				streaming={session.streaming}
				onNewChat={session.reset}
			/>
			<TurnList
				turns={session.turns}
				streaming={session.streaming}
				error={session.error}
			/>
			<Composer
				streaming={session.streaming}
				onSend={session.send}
				onStop={session.stop}
			/>
		</div>
	);
};

export const Route = createFileRoute("/_authenticated/chat/")({
	component: ChatPage,
});
