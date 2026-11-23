import { CHAT_SCREEN_MESSAGE } from "@app/messages";
import { A } from "@mobily/ts-belt";
import type { FC, ReactElement } from "react";
import { EmptyState } from "@app/shell/components/empty-state.tsx";
import type { TChatTurn } from "#/routes/_authenticated/chat/_stores/chat-store.ts";
import { TurnBubble } from "#/routes/_authenticated/chat/_components/turn-bubble.tsx";

type TTurnListProps = {
	turns: readonly TChatTurn[];
	streaming: boolean;
	error: string | null;
};

export const TurnList: FC<TTurnListProps> = (props): ReactElement => (
	<div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto">
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
			{A.isEmpty(props.turns) && (
				<div className="flex justify-center pt-24">
					<EmptyState message={CHAT_SCREEN_MESSAGE.EMPTY} />
				</div>
			)}
			{A.mapWithIndex(props.turns, (index, turn) => (
				<TurnBubble
					key={turn.id}
					turn={turn}
					live={props.streaming && index === props.turns.length - 1}
				/>
			))}
			{props.error !== null && (
				<p role="alert" className="text-sm text-destructive">
					{props.error}
				</p>
			)}
		</div>
	</div>
);
