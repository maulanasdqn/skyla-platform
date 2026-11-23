import SwiftUI

struct CloudModelsSection: View {
    @EnvironmentObject private var chat: ChatModel
    @EnvironmentObject private var account: AccountModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        if !account.signedIn {
            Section {
                Label("Sign in on the Account tab to use models on your Skyla server.", systemImage: "person.crop.circle.badge.exclamationmark")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        } else {
            Section {
                if chat.cloudModels.isEmpty {
                    HStack {
                        Text(chat.cloudLoading ? "Loading models…" : "No models on the server")
                            .foregroundStyle(.secondary)
                        Spacer()
                        if chat.cloudLoading { ProgressView() }
                    }
                }
                ForEach(chat.cloudModels) { model in
                    Button {
                        chat.selectCloud(model)
                        dismiss()
                    } label: { CloudModelRow(model: model, active: chat.cloudModel == model) }
                        .buttonStyle(.plain)
                        .disabled(!model.supported || chat.phase == .generating)
                }
            } header: {
                Text(account.client.base.host() ?? "Server")
            } footer: {
                Text("Replies are generated on the server. Switching models there can take a few seconds.")
            }
            .task { await chat.refreshCloudModels() }
        }
    }
}

struct CloudModelRow: View {
    let model: CloudModel
    let active: Bool

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: active ? "checkmark" : "cloud")
                .font(.body.weight(.semibold))
                .foregroundStyle(active ? .white : Color.accentColor)
                .frame(width: 36, height: 36)
                .background(active ? Color.green : Color.accentColor.opacity(0.12), in: Circle())
            VStack(alignment: .leading, spacing: 3) {
                Text(model.name).font(.subheadline.weight(.semibold)).lineLimit(2)
                Text(model.supported ? model.architecture : "\(model.architecture) · not supported")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 8)
            Badge(text: active ? "Active" : model.loaded ? "Loaded" : String(format: "%.1f GB", model.sizeGb),
                  color: active || model.loaded ? .green : .secondary)
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
        .opacity(model.supported ? 1 : 0.5)
    }
}
