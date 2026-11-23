import { type Effect, Stream } from "effect";
import type { TAppRuntime, TAppRuntimeServices } from "#/bootstrap/compose.ts";
import type { TDomainError } from "#/shared/errors.ts";
import { domainErrorToORPC, effectRun } from "#/platform/orpc/run-effect.ts";

const iteratorOf = async function* <A>(
	iterable: AsyncIterable<A>,
): AsyncGenerator<A, void, void> {
	yield* iterable;
};

export const streamRun = async <A>(
	runtime: TAppRuntime,
	effect: Effect.Effect<
		Stream.Stream<A, TDomainError>,
		TDomainError,
		TAppRuntimeServices
	>,
): Promise<AsyncGenerator<A, void, void>> => {
	const stream = await effectRun(runtime, effect);
	const failuresAsORPC = Stream.catch(
		stream,
		(error: TDomainError): Stream.Stream<never> =>
			Stream.die(domainErrorToORPC(error)),
	);
	return iteratorOf(Stream.toAsyncIterable(failuresAsORPC));
};
