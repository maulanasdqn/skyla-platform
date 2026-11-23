import { ROUTE_PATH } from "@app/contract";
import { CHAT_EVENT_TYPE, CHAT_ROLE } from "@app/schemas";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE_URL } from "../support/client.ts";
import {
	FAIL_PROMPT,
	FAKE_CATALOG,
	FAKE_REPLY,
	fakeInferenceStart,
	type TFakeInference,
} from "../support/inference-fake.ts";
import { SEED_CREDENTIALS } from "../support/sign-in.ts";

const OK = 200;
const UNAUTHORIZED = 401;
const SERVICE_UNAVAILABLE = 503;
const BAD_REQUEST = 400;
const AUTH_TOKEN_HEADER = "set-auth-token";
const EVENT_STREAM = "text/event-stream";

let fake: TFakeInference;
let token = "";

const bearerOf = (value: string): Record<string, string> => ({
	Authorization: `Bearer ${value}`,
	"Content-Type": "application/json",
});

const streamPost = (body: unknown, auth = token): Promise<Response> =>
	fetch(`${BASE_URL}/api${ROUTE_PATH.CHAT_STREAM}`, {
		method: "POST",
		headers: bearerOf(auth),
		body: JSON.stringify(body),
	});

const dataFrames = (text: string, event: string): unknown[] =>
	text
		.split("\n\n")
		.filter((frame) => frame.includes(`event: ${event}`))
		.map((frame) => {
			const data = frame.split("\n").find((line) => line.startsWith("data: "));
			return data === undefined ? undefined : JSON.parse(data.slice(6));
		});

const userSays = (content: string): unknown => ({
	messages: [{ role: CHAT_ROLE.USER, content }],
});

beforeAll(async (): Promise<void> => {
	fake = await fakeInferenceStart();
	const response = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(SEED_CREDENTIALS.viewer),
	});
	token = response.headers.get(AUTH_TOKEN_HEADER) ?? "";
});

afterAll(async (): Promise<void> => {
	await fake.stop();
});

describe("chat endpoints", () => {
	it("hands a mobile client a bearer token at sign-in", (): void => {
		expect(token).not.toBe("");
	});

	it("lists the service's models to a bearer-authenticated caller", async (): Promise<void> => {
		const response = await fetch(`${BASE_URL}/api${ROUTE_PATH.CHAT_MODELS}`, {
			headers: bearerOf(token),
		});

		expect(response.status).toBe(OK);
		expect(await response.json()).toEqual({
			models: [
				{
					id: FAKE_CATALOG.models[0]?.id,
					name: FAKE_CATALOG.models[0]?.name,
					architecture: FAKE_CATALOG.models[0]?.arch,
					sizeGb: FAKE_CATALOG.models[0]?.size_gb,
					supported: true,
					loaded: true,
				},
			],
		});
	});

	it("refuses chat without a session", async (): Promise<void> => {
		const response = await streamPost(userSays("hi"), "not-a-token");

		expect(response.status).toBe(UNAUTHORIZED);
	});

	it("refuses an empty conversation", async (): Promise<void> => {
		const response = await streamPost({ messages: [] });

		expect(response.status).toBe(BAD_REQUEST);
	});

	it("streams tokens and stats as server-sent events", async (): Promise<void> => {
		const response = await streamPost({
			...(userSays("hi") as object),
			maxTokens: 32,
		});
		const text = await response.text();

		expect(response.status).toBe(OK);
		expect(response.headers.get("content-type")).toContain(EVENT_STREAM);
		expect(dataFrames(text, "message")).toEqual([
			...FAKE_REPLY.map((part) => ({
				type: CHAT_EVENT_TYPE.TOKEN,
				text: part,
				thinking: false,
			})),
			{
				type: CHAT_EVENT_TYPE.DONE,
				promptTokens: 7,
				completionTokens: FAKE_REPLY.length,
				tokensPerSecond: 50,
				contextUsed: 9,
				contextSize: 4096,
			},
		]);
		expect(fake.requests.at(-1)).toMatchObject({
			model: null,
			settings: { max_tokens: 32 },
		});
	});

	it("ends the stream with an error event when the service fails midway", async (): Promise<void> => {
		const response = await streamPost(userSays(FAIL_PROMPT));
		const text = await response.text();

		expect(dataFrames(text, "error")).toEqual([
			expect.objectContaining({
				code: "SERVICE_UNAVAILABLE",
				status: SERVICE_UNAVAILABLE,
			}),
		]);
	});

	it("answers 503 when the service cannot be reached", async (): Promise<void> => {
		await fake.stop();

		const response = await streamPost(userSays("hi"));

		expect(response.status).toBe(SERVICE_UNAVAILABLE);
		fake = await fakeInferenceStart();
	});
});
