import { CHAT_SCREEN_MESSAGE } from "@app/messages";
import { A } from "@mobily/ts-belt";
import type { TChatDoneEvent } from "@app/schemas";
import { TOKENS_PER_SECOND_DIGITS } from "#/routes/_authenticated/chat/_constants/chat.ts";

export const turnStatsLabel = (stats: TChatDoneEvent): string =>
	A.join(
		[
			`${stats.completionTokens} ${CHAT_SCREEN_MESSAGE.TOKENS}`,
			`${stats.tokensPerSecond.toFixed(TOKENS_PER_SECOND_DIGITS)} ${CHAT_SCREEN_MESSAGE.TOKENS_PER_SECOND}`,
			`${CHAT_SCREEN_MESSAGE.CONTEXT} ${stats.contextUsed}${CHAT_SCREEN_MESSAGE.CONTEXT_SEPARATOR}${stats.contextSize}`,
		],
		CHAT_SCREEN_MESSAGE.STATS_SEPARATOR,
	);
