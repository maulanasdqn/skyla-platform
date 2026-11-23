import { CHAT_MESSAGE } from "@app/messages";
import { ORPCError } from "@orpc/client";
import { match, P } from "ts-pattern";
import {
	ABORT_ERROR_NAME,
	SERVICE_UNAVAILABLE_CODE,
} from "#/routes/_authenticated/chat/_constants/chat.ts";

const isAbort = (error: unknown): boolean =>
	match(error)
		.with({ name: ABORT_ERROR_NAME }, (): boolean => true)
		.otherwise((): boolean => false);

export const chatErrorMessage = (error: unknown): string | null =>
	match(error)
		.when(isAbort, (): null => null)
		.with(P.instanceOf(ORPCError), (failure): string =>
			match(failure.code)
				.with(SERVICE_UNAVAILABLE_CODE, (): string => failure.message)
				.otherwise((): string => CHAT_MESSAGE.INFERENCE_FAILED),
		)
		.otherwise((): string => CHAT_MESSAGE.INFERENCE_FAILED);
