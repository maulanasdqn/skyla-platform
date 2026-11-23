import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@app/components/ui/collapsible";
import { CHAT_SCREEN_MESSAGE } from "@app/messages";
import { ChevronRight } from "lucide-react";
import type { FC, ReactElement } from "react";

type TThinkingBlockProps = {
	text: string;
	open: boolean;
};

export const ThinkingBlock: FC<TThinkingBlockProps> = (props): ReactElement => (
	<Collapsible defaultOpen={props.open} className="group">
		<CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
			<ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
			{CHAT_SCREEN_MESSAGE.THINKING}
		</CollapsibleTrigger>
		<CollapsibleContent>
			<p className="mt-2 border-l-2 pl-3 text-sm whitespace-pre-wrap text-muted-foreground">
				{props.text.trim()}
			</p>
		</CollapsibleContent>
	</Collapsible>
);
