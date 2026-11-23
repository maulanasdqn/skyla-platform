import { useForm } from "@tanstack/react-form";
import type { FormEvent, KeyboardEvent } from "react";
import { match } from "ts-pattern";
import type { TValidatedForm } from "@app/shell/libs/forms/form-hook.ts";
import { COMPOSER_SUBMIT_KEY } from "#/routes/_authenticated/chat/_constants/chat.ts";

type TComposerValues = { text: string };

const DEFAULT_VALUES: TComposerValues = { text: "" };

export type TComposer = {
	form: TValidatedForm<TComposerValues>;
	onSubmit: (event: FormEvent) => void;
	onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
};

const isSubmitKey = (event: KeyboardEvent<HTMLTextAreaElement>): boolean =>
	event.key === COMPOSER_SUBMIT_KEY && !event.shiftKey;

export const useComposer = (
	send: (text: string) => Promise<void>,
): TComposer => {
	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		onSubmit: ({ value, formApi }): void => {
			const text = value.text.trim();
			match(text === "")
				.with(true, (): undefined => undefined)
				.otherwise((): void => {
					formApi.reset();
					void send(text);
				});
		},
	});

	return {
		form,
		onSubmit: (event: FormEvent): void => {
			event.preventDefault();
			void form.handleSubmit();
		},
		onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>): void => {
			match(isSubmitKey(event))
				.with(true, (): void => {
					event.preventDefault();
					void form.handleSubmit();
				})
				.otherwise((): undefined => undefined);
		},
	};
};
