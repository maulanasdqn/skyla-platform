import { Effect, Stream } from "effect";
import { describe, expect, it } from "vitest";
import { INFERENCE_EVENT_TYPE } from "#/chat/domain/inference.ts";
import { inferenceEventsOf } from "#/chat/infrastructure/inference-ndjson.ts";
import { ERROR_TAG } from "#/shared/error-tags.ts";

const encoder = new TextEncoder();

const chunksOf = (
	...chunks: readonly string[]
): Stream.Stream<Uint8Array, never> =>
	Stream.fromIterable(chunks.map((chunk) => encoder.encode(chunk)));

const collect = (...chunks: readonly string[]): Promise<unknown> =>
	Effect.runPromise(Stream.runCollect(inferenceEventsOf(chunksOf(...chunks))));

describe("inferenceEventsOf", () => {
	it("parses one event per line, even when a line is split across chunks", async (): Promise<void> => {
		const events = await collect(
			'{"type":"started"}\n{"type":"tok',
			'en","text":"Hi","thinking":false}\n',
			'{"type":"done","prompt_tokens":1,"prefill_ms":2,"tokens":3,"tokens_per_second":4,"position":5,"context":6}\n',
		);

		expect(events).toEqual([
			{ type: INFERENCE_EVENT_TYPE.STARTED },
			{ type: INFERENCE_EVENT_TYPE.TOKEN, text: "Hi", thinking: false },
			{
				type: INFERENCE_EVENT_TYPE.DONE,
				prompt_tokens: 1,
				prefill_ms: 2,
				tokens: 3,
				tokens_per_second: 4,
				position: 5,
				context: 6,
			},
		]);
	});

	it("keeps a multi-byte character split across chunks intact", async (): Promise<void> => {
		const bytes = encoder.encode(
			'{"type":"token","text":"é","thinking":true}\n',
		);
		const split = bytes.indexOf(0xc3) + 1;

		const events = await Effect.runPromise(
			Stream.runCollect(
				inferenceEventsOf(
					Stream.fromIterable([bytes.slice(0, split), bytes.slice(split)]),
				),
			),
		);

		expect(events).toEqual([
			{ type: INFERENCE_EVENT_TYPE.TOKEN, text: "é", thinking: true },
		]);
	});

	it("skips blank lines and accepts a last line without a newline", async (): Promise<void> => {
		const events = await collect(
			'\n\n{"type":"loading","id":"m"}\r\n\n{"type":"error","message":"boom"}',
		);

		expect(events).toEqual([
			{ type: INFERENCE_EVENT_TYPE.LOADING, id: "m" },
			{ type: INFERENCE_EVENT_TYPE.ERROR, message: "boom" },
		]);
	});

	it("fails with the inference error on a line that is not JSON", async (): Promise<void> => {
		await expect(collect("not json\n")).rejects.toMatchObject({
			_tag: ERROR_TAG.INFERENCE_UNAVAILABLE,
		});
	});

	it("fails with the inference error on an event it does not know", async (): Promise<void> => {
		await expect(collect('{"type":"surprise"}\n')).rejects.toMatchObject({
			_tag: ERROR_TAG.INFERENCE_UNAVAILABLE,
		});
	});
});
