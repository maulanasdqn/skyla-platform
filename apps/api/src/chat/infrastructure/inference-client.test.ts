import { Effect, Stream } from "effect";
import { describe, expect, it, vi } from "vitest";
import { INFERENCE_EVENT_TYPE } from "#/chat/domain/inference.ts";
import { inferenceClientOf } from "#/chat/infrastructure/inference-client.ts";
import { ERROR_TAG } from "#/shared/error-tags.ts";

const BASE_URL = "http://inference.test:8080";
const TOKEN = "service-token";
const CATALOG = {
	models: [{ id: "m", name: "M", arch: "qwen3", size_gb: 1, supported: true }],
	loaded: "m",
};
const REQUEST = {
	model: null,
	messages: [{ role: "user", content: "Hi" }],
	settings: {
		temperature: 0.6,
		top_k: 40,
		top_p: 0.95,
		max_tokens: 16,
		system: null,
	},
} as const;
const NDJSON =
	'{"type":"started"}\n{"type":"token","text":"Hi","thinking":false}\n';
const SERVICE_UNAVAILABLE = 503;

type TFetch = typeof fetch;

const fetchAnswering = (
	response: () => Response,
): ReturnType<typeof vi.fn<TFetch>> =>
	vi.fn<TFetch>(async (): Promise<Response> => response());

describe("inferenceClientOf", () => {
	it("reads the catalog and sends the service token", async (): Promise<void> => {
		const fetcher = fetchAnswering(() => Response.json(CATALOG));

		const catalog = await Effect.runPromise(
			inferenceClientOf(BASE_URL, TOKEN, fetcher).models(),
		);

		expect(catalog).toEqual(CATALOG);
		expect(fetcher.mock.calls[0]?.[0]).toBe(`${BASE_URL}/v1/models`);
		expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({
			Authorization: `Bearer ${TOKEN}`,
		});
	});

	it("sends no Authorization header without a token", async (): Promise<void> => {
		const fetcher = fetchAnswering(() => Response.json(CATALOG));

		await Effect.runPromise(
			inferenceClientOf(BASE_URL, undefined, fetcher).models(),
		);

		expect(fetcher.mock.calls[0]?.[1]?.headers).not.toHaveProperty(
			"Authorization",
		);
	});

	it("posts the request and streams the decoded events", async (): Promise<void> => {
		const fetcher = fetchAnswering(() => new Response(NDJSON));

		const events = await Effect.runPromise(
			inferenceClientOf(BASE_URL, TOKEN, fetcher)
				.chat(REQUEST)
				.pipe(Effect.flatMap(Stream.runCollect)),
		);

		expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual(
			REQUEST,
		);
		expect(events).toEqual([
			{ type: INFERENCE_EVENT_TYPE.STARTED },
			{ type: INFERENCE_EVENT_TYPE.TOKEN, text: "Hi", thinking: false },
		]);
	});

	it("aborts the request once the stream is done", async (): Promise<void> => {
		const fetcher = fetchAnswering(() => new Response(NDJSON));

		await Effect.runPromise(
			inferenceClientOf(BASE_URL, TOKEN, fetcher)
				.chat(REQUEST)
				.pipe(Effect.flatMap(Stream.runCollect)),
		);

		expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
	});

	it("fails with the inference error when the service answers with an error status", async (): Promise<void> => {
		const fetcher = fetchAnswering(
			() => new Response(null, { status: SERVICE_UNAVAILABLE }),
		);

		await expect(
			Effect.runPromise(
				inferenceClientOf(BASE_URL, TOKEN, fetcher).chat(REQUEST),
			),
		).rejects.toMatchObject({ _tag: ERROR_TAG.INFERENCE_UNAVAILABLE });
	});

	it("fails with the inference error when the service cannot be reached", async (): Promise<void> => {
		const fetcher = vi.fn<TFetch>(async (): Promise<Response> => {
			throw new TypeError("fetch failed");
		});

		await expect(
			Effect.runPromise(inferenceClientOf(BASE_URL, TOKEN, fetcher).models()),
		).rejects.toMatchObject({ _tag: ERROR_TAG.INFERENCE_UNAVAILABLE });
	});

	it("fails with the inference error on a catalog of the wrong shape", async (): Promise<void> => {
		const fetcher = fetchAnswering(() => Response.json({ models: "nope" }));

		await expect(
			Effect.runPromise(inferenceClientOf(BASE_URL, TOKEN, fetcher).models()),
		).rejects.toMatchObject({ _tag: ERROR_TAG.INFERENCE_UNAVAILABLE });
	});
});
