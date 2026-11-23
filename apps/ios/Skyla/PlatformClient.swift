import Foundation

struct PlatformError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

struct PlatformUser: Decodable, Equatable {
    let email: String
    let name: String?
}

struct CloudModel: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let architecture: String
    let sizeGb: Double
    let supported: Bool
    let loaded: Bool
}

enum SignInResult {
    case signedIn(token: String, user: PlatformUser?)
    case needsTwoFactor
}

struct PlatformClient: Sendable {
    let base: URL
    let token: String

    static let defaultBase = "http://localhost:3001"

    private func request(_ path: String, method: String = "GET", body: Encodable? = nil) throws -> URLRequest {
        guard let url = URL(string: path, relativeTo: base) else {
            throw PlatformError(message: "Invalid server address")
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if !token.isEmpty { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }
        return request
    }

    private func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw PlatformError(message: "No response") }
        if http.statusCode >= 400 { throw PlatformError(message: Self.message(from: data, status: http.statusCode)) }
        return (data, http)
    }

    static func message(from data: Data, status: Int) -> String {
        let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        if let message = json?["message"] as? String, !message.isEmpty { return message }
        return "Server returned \(status)"
    }

    func signIn(email: String, password: String) async throws -> SignInResult {
        struct Body: Encodable { let email: String; let password: String }
        struct Reply: Decodable { let token: String?; let user: PlatformUser?; let twoFactorRedirect: Bool? }
        let (data, http) = try await send(request("/api/auth/sign-in/email", method: "POST",
                                                  body: Body(email: email, password: password)))
        let reply = try JSONDecoder().decode(Reply.self, from: data)
        if reply.twoFactorRedirect == true { return .needsTwoFactor }
        guard let token = http.value(forHTTPHeaderField: "set-auth-token") ?? reply.token, !token.isEmpty else {
            throw PlatformError(message: "The server did not return a session")
        }
        return .signedIn(token: token, user: reply.user)
    }

    func signOut() async throws {
        struct Empty: Encodable {}
        _ = try await send(request("/api/auth/sign-out", method: "POST", body: Empty()))
    }

    func session() async throws -> PlatformUser? {
        struct Reply: Decodable { let user: PlatformUser }
        let (data, _) = try await send(request("/api/auth/get-session"))
        return try? JSONDecoder().decode(Reply.self, from: data).user
    }

    func models() async throws -> [CloudModel] {
        struct Reply: Decodable { let models: [CloudModel] }
        let (data, _) = try await send(request("/api/chat/models"))
        return try JSONDecoder().decode(Reply.self, from: data).models
    }

    func stream(_ body: ChatStreamBody, onEvent: (ChatStreamEvent) -> Void) async throws {
        var request = try request("/api/chat/stream", method: "POST", body: body)
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.timeoutInterval = 600
        let (bytes, response) = try await URLSession.shared.bytes(for: request)
        if let http = response as? HTTPURLResponse, http.statusCode >= 400 {
            var data = Data()
            for try await byte in bytes { data.append(byte) }
            throw PlatformError(message: Self.message(from: data, status: http.statusCode))
        }
        var event = "message"
        for try await line in bytes.lines {
            if line.hasPrefix("event:") {
                event = line.dropFirst(6).trimmingCharacters(in: .whitespaces)
                if event == "done" { return }
                continue
            }
            guard line.hasPrefix("data:") else { continue }
            let payload = Data(line.dropFirst(5).trimmingCharacters(in: .whitespaces).utf8)
            if event == "error" {
                throw PlatformError(message: Self.message(from: payload, status: 500))
            }
            guard let decoded = try? JSONDecoder().decode(ChatStreamEvent.self, from: payload) else { continue }
            onEvent(decoded)
            if case .done = decoded { return }
            event = "message"
        }
    }
}

struct ChatStreamBody: Encodable {
    let model: String?
    let messages: [ChatTurn]
    let temperature: Float
    let topP: Float
    let maxTokens: UInt32
}

enum ChatStreamEvent: Decodable {
    case token(text: String, thinking: Bool)
    case done(ChatStats)

    private enum Keys: String, CodingKey {
        case type, text, thinking, completionTokens, tokensPerSecond, contextUsed, contextSize
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: Keys.self)
        switch try c.decode(String.self, forKey: .type) {
        case "token":
            self = .token(text: try c.decode(String.self, forKey: .text),
                          thinking: try c.decodeIfPresent(Bool.self, forKey: .thinking) ?? false)
        case "done":
            self = .done(ChatStats(
                tokens: try c.decodeIfPresent(Int.self, forKey: .completionTokens) ?? 0,
                tokensPerSecond: try c.decodeIfPresent(Double.self, forKey: .tokensPerSecond) ?? 0,
                position: try c.decodeIfPresent(Int.self, forKey: .contextUsed) ?? 0,
                context: try c.decodeIfPresent(Int.self, forKey: .contextSize) ?? 0))
        case let other:
            throw DecodingError.dataCorruptedError(forKey: .type, in: c, debugDescription: "unknown event \(other)")
        }
    }
}

final class CloudEngine: ChatEngine, @unchecked Sendable {
    private let lock = NSLock()
    private var client: PlatformClient
    private var model: String?
    private var task: Task<ChatStats, Error>?

    init(client: PlatformClient) { self.client = client }

    func configure(client: PlatformClient, model: String?) {
        lock.lock()
        self.client = client
        self.model = model
        lock.unlock()
    }

    func reply(to history: [ChatTurn], settings: ChatSettings,
               onToken: @escaping @Sendable (String, Bool) -> Void) async throws -> ChatStats {
        let (client, model) = lock.withLock { (self.client, self.model) }
        var turns = history
        if !settings.system.isEmpty { turns.insert(ChatTurn(role: "system", content: settings.system), at: 0) }
        let body = ChatStreamBody(model: model, messages: turns, temperature: settings.temperature,
                                  topP: settings.topP, maxTokens: settings.maxTokens)
        let task = Task<ChatStats, Error> {
            var stats = ChatStats(tokens: 0, tokensPerSecond: 0, position: 0, context: 0)
            var count = 0
            do {
                try await client.stream(body) { event in
                    switch event {
                    case .token(let text, let thinking):
                        count += 1
                        onToken(text, thinking)
                    case .done(let s): stats = s
                    }
                }
            } catch where Task.isCancelled {
                return ChatStats(tokens: count, tokensPerSecond: 0, position: 0, context: 0)
            }
            return stats
        }
        lock.withLock { self.task = task }
        return try await task.value
    }

    func cancel() {
        lock.lock()
        task?.cancel()
        lock.unlock()
    }

    func reset() {}
}
