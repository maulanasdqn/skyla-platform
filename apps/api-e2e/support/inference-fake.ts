import { createServer, type IncomingMessage, type Server } from "node:http";
import { INFERENCE_FAKE_TOKEN, INFERENCE_PORT } from "./services.ts";

export const FAKE_CATALOG = {
	models: [
		{ id: "tiny", name: "Tiny", arch: "qwen3", size_gb: 0.6, supported: true },
	],
	loaded: "tiny",
};

export const FAKE_REPLY = ["Hel", "lo"] as const;

export const FAIL_PROMPT = "please fail";

export type TFakeInference = {
	requests: unknown[];
	stop: () => Promise<void>;
};

const bodyOf = async (request: IncomingMessage): Promise<string> => {
	let body = "";
	for await (const chunk of request) {
		body += chunk;
	}
	return body;
};

const lineOf = (event: unknown): string => `${JSON.stringify(event)}\n`;

const replyLines = (prompt: string): readonly string[] =>
	prompt === FAIL_PROMPT
		? [lineOf({ type: "started" }), lineOf({ type: "error", message: "boom" })]
		: [
				lineOf({ type: "started" }),
				...FAKE_REPLY.map((text) =>
					lineOf({ type: "token", text, thinking: false }),
				),
				lineOf({
					type: "done",
					prompt_tokens: 7,
					prefill_ms: 3,
					tokens: FAKE_REPLY.length,
					tokens_per_second: 50,
					position: 9,
					context: 4096,
				}),
			];

export const fakeInferenceStart = async (): Promise<TFakeInference> => {
	const requests: unknown[] = [];
	const server: Server = createServer(async (request, response) => {
		if (request.headers.authorization !== `Bearer ${INFERENCE_FAKE_TOKEN}`) {
			response.writeHead(401).end();
			return;
		}
		if (request.url === "/v1/models") {
			response.writeHead(200, { "Content-Type": "application/json" });
			response.end(JSON.stringify(FAKE_CATALOG));
			return;
		}
		const body = JSON.parse(await bodyOf(request));
		requests.push(body);
		response.writeHead(200, { "Content-Type": "application/x-ndjson" });
		const last = body.messages[body.messages.length - 1];
		for (const line of replyLines(last.content)) {
			response.write(line);
		}
		response.end();
	});
	await new Promise<void>((resolve) =>
		server.listen(INFERENCE_PORT, "127.0.0.1", resolve),
	);
	return {
		requests,
		stop: () =>
			new Promise<void>((resolve) => {
				server.closeAllConnections();
				server.close(() => resolve());
			}),
	};
};
