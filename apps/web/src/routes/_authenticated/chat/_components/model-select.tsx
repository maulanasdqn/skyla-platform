import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@app/components/ui/select";
import { Skeleton } from "@app/components/ui/skeleton";
import { CHAT_SCREEN_MESSAGE } from "@app/messages";
import { A } from "@mobily/ts-belt";
import type { FC, ReactElement } from "react";
import type { TChatModels } from "#/routes/_authenticated/chat/_hooks/use-chat-models.ts";

type TModelSelectProps = {
	models: TChatModels;
	disabled: boolean;
};

export const ModelSelect: FC<TModelSelectProps> = (props): ReactElement =>
	props.models.isPending ? (
		<Skeleton className="h-9 w-56" />
	) : (
		<Select
			value={props.models.selected ?? undefined}
			onValueChange={props.models.select}
			disabled={props.disabled || A.isEmpty(props.models.models)}
		>
			<SelectTrigger className="w-56">
				<SelectValue
					placeholder={
						A.isEmpty(props.models.models)
							? CHAT_SCREEN_MESSAGE.MODELS_EMPTY
							: CHAT_SCREEN_MESSAGE.MODEL_PLACEHOLDER
					}
				/>
			</SelectTrigger>
			<SelectContent>
				{A.map(props.models.models, (model) => (
					<SelectItem
						key={model.id}
						value={model.id}
						disabled={!model.supported}
					>
						{model.name}
						{!model.supported && (
							<span className="text-xs text-muted-foreground">
								{CHAT_SCREEN_MESSAGE.MODEL_UNSUPPORTED}
							</span>
						)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
