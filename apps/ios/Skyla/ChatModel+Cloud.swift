import Foundation

extension ChatModel {
    var mode: EngineMode { EngineMode(rawValue: modeRaw) ?? .device }

    var hasModel: Bool {
        switch mode {
        case .device: current != nil
        case .cloud: account?.signedIn == true
        }
    }

    var currentName: String? {
        switch mode {
        case .device: current?.short
        case .cloud: account?.signedIn == true ? (cloudModel?.name ?? "Cloud") : nil
        }
    }

    func attach(_ account: AccountModel) {
        self.account = account
        if mode == .cloud { useCloud() }
    }

    func use(_ mode: EngineMode) {
        guard !busy || phase == .ready, mode != self.mode else { return }
        modeRaw = mode.rawValue
        messages = []
        switch mode {
        case .device:
            phase = current == nil ? .idle : .ready
            status = current == nil ? "Pick a model to start" : "\(current!.name) on \(ChatModel.chip)"
        case .cloud:
            useCloud()
        }
    }

    func useCloud() {
        guard let account else { return }
        problem = nil
        guard account.signedIn else {
            phase = .idle
            status = "Sign in on the Account tab to use cloud models"
            return
        }
        configureCloud()
        phase = .ready
        status = "Cloud · \(account.client.base.host() ?? "server")"
        Task { await refreshCloudModels() }
    }

    func refreshCloudModels() async {
        guard let account, account.signedIn else { return }
        cloudLoading = true
        defer { cloudLoading = false }
        do {
            cloudModels = try await account.client.models()
            cloudModel = cloudModels.first { $0.id == lastCloudModel }
                ?? cloudModels.first { $0.loaded }
                ?? cloudModel
            configureCloud()
        } catch {
            problem = error.localizedDescription
        }
    }

    func selectCloud(_ model: CloudModel) {
        guard model.supported, !busy || phase == .ready else { return }
        cloudModel = model
        lastCloudModel = model.id
        messages = []
        configureCloud()
    }

    func accountChanged() {
        guard mode == .cloud else { return }
        cloudModels = []
        cloudModel = nil
        messages = []
        useCloud()
    }

    private func configureCloud() {
        guard let account else { return }
        cloudEngine.configure(client: account.client, model: cloudModel?.id)
    }
}
