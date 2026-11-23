import { ORPCError } from "@orpc/server";
import { Effect, Layer, ManagedRuntime, Stream } from "effect";
import { afterAll, describe, expect, it } from "vitest";
import type { TAppRuntime } from "#/bootstrap/compose.ts";
import { streamRun } from "#/platform/orpc/run-stream.ts";
import { EInferenceUnavailable } from "#/shared/errors.ts";

const MESSAGE = "The model server is down.";
const UNAVAILABLE = new EInferenceUnavailable({
	message: MESSAGE,
	cause: "refused",
});
const SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE";

const managed = ManagedRuntime.make(Layer.empty);
const runtime = managed as unknown as TAppRuntime;

const collect = async (iterable: AsyncIterable<number>): Promise<number[]> => {
	const values: number[] = [];
	for await (const value of iterable) {
		values.push(value);
	}
	return values;
};

describe("streamRun", () => {
	afterAll(async (): Promise<void> => {
		await managed.dispose();
	});

	it("yields every element of the opened stream", async (): Promise<void> => {
		const iterator = await streamRun(
			runtime,
			Effect.succeed(Stream.make(1, 2, 3)),
		);

		expect(await collect(iterator)).toEqual([1, 2, 3]);
	});

	it("rejects with a 503 before streaming when the stream cannot be opened", async (): Promise<void> => {
		await expect(
			streamRun(runtime, Effect.fail(UNAVAILABLE)),
		).rejects.toMatchObject({ code: SERVICE_UNAVAILABLE, message: MESSAGE });
	});

	it("throws a 503 from the iterator when the stream fails midway", async (): Promise<void> => {
		const iterator = await streamRun(
			runtime,
			Effect.succeed(Stream.concat(Stream.make(1), Stream.fail(UNAVAILABLE))),
		);

		const failure = await collect(iterator).catch((error: unknown) => error);

		expect(failure).toBeInstanceOf(ORPCError);
		expect(failure).toMatchObject({ code: SERVICE_UNAVAILABLE, status: 503 });
	});

	it("runs the stream's finalizer when the consumer stops early", async (): Promise<void> => {
		let released = false;
		const iterator = await streamRun(
			runtime,
			Effect.succeed(
				Stream.make(1, 2, 3).pipe(
					Stream.ensuring(
						Effect.sync((): void => {
							released = true;
						}),
					),
				),
			),
		);

		await iterator.next();
		await iterator.return();

		expect(released).toBe(true);
	});
});
