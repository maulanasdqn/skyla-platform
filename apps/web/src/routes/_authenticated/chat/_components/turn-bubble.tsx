import { cn } from "@app/components/lib/utils";
import { CHAT_ROLE } from "@app/schemas";
import type { FC, ReactElement } from "react";
import type { TChatTurn } from "#/routes/_authenticated/chat/_stores/chat-store.ts";
import { turnStatsLabel } from "#/routes/_authenticated/chat/_utils/turn-stats.ts";
import { ThinkingBlock } from "#/routes/_authenticated/chat/_components/thinking-block.tsx";

type TTurnBubbleProps = {
	turn: TChatTurn;
	live: boolean;
};

export const TurnBubble: FC<TTurnBubbleProps> = (props): ReactElement => {
	const isUser = props.turn.role === CHAT_ROLE.USER;
	const waiting = props.live && props.turn.content === "";

	return (
		<div
			className={cn("flex flex-col gap-2", isUser && "items-end")}
			aria-busy={waiting}
		>
			{props.turn.thinking !== "" && (
				<ThinkingBlock text={props.turn.thinking} open={props.live} />
			)}
			{waiting && props.turn.thinking === "" ? (
				<span className="size-2 animate-pulse rounded-full bg-muted-foreground" />
			) : (
				<div
					className={cn(
						"max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap",
						isUser && "rounded-2xl bg-muted px-4 py-2",
					)}
				>
					{props.turn.content.trim()}
				</div>
			)}
			{props.turn.stats !== null && (
				<span className="text-xs text-muted-foreground">
					{turnStatsLabel(props.turn.stats)}
				</span>
			)}
		</div>
	);
};
