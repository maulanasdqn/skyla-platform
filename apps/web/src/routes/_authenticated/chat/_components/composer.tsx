import { Button } from "@app/components/ui/button";
import { Textarea } from "@app/components/ui/textarea";
import { CHAT_SCREEN_MESSAGE } from "@app/messages";
import { ArrowUp, Square } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useComposer } from "#/routes/_authenticated/chat/_hooks/use-composer.ts";

type TComposerProps = {
	streaming: boolean;
	onSend: (text: string) => Promise<void>;
	onStop: () => void;
};

export const Composer: FC<TComposerProps> = (props): ReactElement => {
	const composer = useComposer(props.onSend);

	return (
		<form
			onSubmit={composer.onSubmit}
			className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4 pb-6"
		>
			<composer.form.Field name="text">
				{(field) => (
					<Textarea
						aria-label={CHAT_SCREEN_MESSAGE.COMPOSER_LABEL}
						placeholder={CHAT_SCREEN_MESSAGE.COMPOSER_PLACEHOLDER}
						rows={1}
						className="max-h-48 min-h-11 resize-none"
						value={field.state.value}
						onChange={(event) => field.handleChange(event.target.value)}
						onKeyDown={composer.onKeyDown}
					/>
				)}
			</composer.form.Field>
			{props.streaming ? (
				<Button
					type="button"
					size="icon"
					variant="secondary"
					aria-label={CHAT_SCREEN_MESSAGE.STOP}
					onClick={props.onStop}
				>
					<Square />
				</Button>
			) : (
				<Button type="submit" size="icon" aria-label={CHAT_SCREEN_MESSAGE.SEND}>
					<ArrowUp />
				</Button>
			)}
		</form>
	);
};
