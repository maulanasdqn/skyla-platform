import Foundation

enum EngineMode: String, CaseIterable, Identifiable {
    case device
    case cloud

    var id: String { rawValue }
    var title: String {
        switch self {
        case .device: "On device"
        case .cloud: "Cloud"
        }
    }
}

struct ChatTurn: Encodable {
    let role: String
    let content: String
}

struct ChatSettings {
    let system: String
    let temperature: Float
    let topP: Float
    let maxTokens: UInt32
}

struct ChatStats {
    let tokens: Int
    let tokensPerSecond: Double
    let position: Int
    let context: Int
}

protocol ChatEngine: AnyObject, Sendable {
    func reply(to history: [ChatTurn], settings: ChatSettings,
               onToken: @escaping @Sendable (String, Bool) -> Void) async throws -> ChatStats
    func cancel()
    func reset()
}

final class DeviceEngine: ChatEngine, @unchecked Sendable {
    let engine: Engine
    let queue: DispatchQueue

    init(engine: Engine, queue: DispatchQueue) {
        self.engine = engine
        self.queue = queue
    }

    func reply(to history: [ChatTurn], settings: ChatSettings,
               onToken: @escaping @Sendable (String, Bool) -> Void) async throws -> ChatStats {
        let text = history.last?.content ?? ""
        let engine = engine
        return try await withCheckedThrowingContinuation { continuation in
            queue.async {
                let result = Result {
                    try engine.chat(text, system: settings.system, temperature: settings.temperature,
                                    topP: settings.topP, maxTokens: settings.maxTokens, onToken: onToken)
                }
                continuation.resume(with: result.map { s in
                    ChatStats(tokens: Int(s.tokens), tokensPerSecond: Double(s.tokens_per_second),
                              position: Int(s.position), context: Int(s.context))
                })
            }
        }
    }

    func cancel() { engine.cancel() }

    func reset() {
        let engine = engine
        queue.async { engine.reset() }
    }
}
