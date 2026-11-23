import Foundation
import Metal
import SwiftUI

enum Phase: Equatable {
    case idle
    case downloading(Double)
    case loading
    case ready
    case generating
}

@MainActor
final class ChatModel: ObservableObject {
    @Published var messages: [MessageModel] = []
    @Published var phase: Phase = .idle
    @Published var models: [ModelOption] = Models.all()
    @Published var current: ModelOption?
    @Published var status = "Pick a model to start"
    @Published var problem: String?
    @Published var loadSeconds: Double?

    nonisolated static let gpuName: String = MTLCreateSystemDefaultDevice()?.name ?? "Apple GPU"
    nonisolated static var chip: String {
        gpuName.replacingOccurrences(of: "Apple ", with: "").replacingOccurrences(of: " GPU", with: "")
    }
    @AppStorage("temperature") var temperature = 0.7
    @AppStorage("maxTokens") var maxTokens = 1024
    @AppStorage("system") var system = ""
    @AppStorage("lastModel") private var lastModel = ""
    @AppStorage("engineMode") var modeRaw = EngineMode.device.rawValue
    @AppStorage("lastCloudModel") var lastCloudModel = ""
    @Published var cloudModels: [CloudModel] = []
    @Published var cloudModel: CloudModel?
    @Published var cloudLoading = false
    weak var account: AccountModel?

    private let engine = Engine()
    private let queue = DispatchQueue(label: "skyla.engine", qos: .userInitiated)
    private(set) lazy var deviceEngine = DeviceEngine(engine: engine, queue: queue)
    let cloudEngine = CloudEngine(client: PlatformClient(base: URL(string: PlatformClient.defaultBase)!, token: ""))
    private var activeEngine: ChatEngine { mode == .cloud ? cloudEngine : deviceEngine }
    private let downloader = Downloader()
    nonisolated static let context: UInt32 = 4096

    init() {
        if mode == .device, let last = models.first(where: { $0.id == lastModel && $0.isDownloaded }) {
            load(last)
        }
    }

    var busy: Bool {
        switch phase {
        case .downloading, .loading, .generating: true
        default: false
        }
    }

    func refresh() {
        models = Models.all()
    }

    func select(_ option: ModelOption) {
        if option.isDownloaded {
            load(option)
        } else {
            download(option)
        }
    }

    private func download(_ option: ModelOption) {
        phase = .downloading(0)
        status = "Downloading \(option.name)…"
        downloader.start(option, progress: { p in
            Task { @MainActor in self.phase = .downloading(p) }
        }, finish: { result in
            Task { @MainActor in
                self.refresh()
                switch result {
                case .success: self.load(option)
                case .failure(let e):
                    self.phase = .idle
                    self.status = "Download failed: \(e.localizedDescription)"
                    self.problem = self.status
                }
            }
        })
    }

    func load(_ option: ModelOption) {
        if mode != .device { modeRaw = EngineMode.device.rawValue }
        phase = .loading
        status = "Loading \(option.name)…"
        messages = []
        let engine = engine
        let path = option.file.path
        queue.async {
            let started = Date()
            let result = Result { try engine.load(path: path, context: Self.context) }
            let seconds = Date().timeIntervalSince(started)
            Task { @MainActor in
                switch result {
                case .success:
                    self.current = option
                    self.lastModel = option.id
                    self.phase = .ready
                    self.status = "\(engine.deviceName) · loaded in \(String(format: "%.1f", seconds)) s"
                    self.loadSeconds = seconds
                    self.problem = nil
                case .failure(let e):
                    self.current = nil
                    self.phase = .idle
                    self.status = e.localizedDescription
                    self.problem = e.localizedDescription
                }
            }
        }
    }

    func send(_ text: String) {
        let text = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, phase == .ready else { return }
        let history = messages.filter { $0.error == nil && !$0.text.isEmpty }.map {
            ChatTurn(role: $0.user ? "user" : "assistant", content: $0.text)
        } + [ChatTurn(role: "user", content: text)]
        let reply = MessageModel(user: false, streaming: true)
        messages.append(MessageModel(user: true, text: text))
        messages.append(reply)
        phase = .generating
        let pending = PendingText()
        let settings = ChatSettings(system: system, temperature: Float(temperature), topP: 0.95,
                                    maxTokens: UInt32(maxTokens))
        let engine = activeEngine
        Task { @MainActor in
            while true {
                let chunk = pending.take()
                reply.receive(chunk)
                if !reply.reveal(finished: chunk.finished) { break }
                try? await Task.sleep(for: .milliseconds(16))
            }
        }
        Task { @MainActor in
            do {
                let s = try await engine.reply(to: history, settings: settings) { piece, thinking in
                    pending.append(piece, thinking: thinking)
                }
                reply.stats = s.context > 0
                    ? String(format: "%d tokens · %.1f tok/s · %d/%d context",
                             s.tokens, s.tokensPerSecond, s.position, s.context)
                    : "\(s.tokens) tokens"
            } catch {
                reply.error = error.localizedDescription
            }
            pending.finish()
            self.phase = .ready
        }
    }

    func stop() {
        activeEngine.cancel()
    }

    func newChat() {
        guard phase == .ready else { return }
        activeEngine.reset()
        messages = []
    }

    func delete(_ option: ModelOption) {
        guard option != current, !busy else { return }
        try? FileManager.default.removeItem(at: option.file)
        refresh()
    }

    func flush() {
        guard mode == .device, phase == .ready else { return }
        let engine = engine
        queue.async { engine.unload() }
        current = nil
        messages = []
        phase = .idle
        status = "Memory flushed · pick a model to load it again"
    }
}
