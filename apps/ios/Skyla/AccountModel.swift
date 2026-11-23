import Foundation
import SwiftUI

@MainActor
final class AccountModel: ObservableObject {
    @AppStorage("serverURL") var serverURL = PlatformClient.defaultBase
    @Published private(set) var token: String = Keychain.get(Keychain.session)
    @Published private(set) var user: PlatformUser?
    @Published private(set) var working = false
    @Published var problem: String?

    var signedIn: Bool { !token.isEmpty }

    var client: PlatformClient {
        let trimmed = serverURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let base = URL(string: trimmed) ?? URL(string: PlatformClient.defaultBase)!
        return PlatformClient(base: base, token: token)
    }

    func signIn(email: String, password: String) async {
        working = true
        problem = nil
        defer { working = false }
        do {
            switch try await client.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password) {
            case .needsTwoFactor:
                problem = "This account uses two-factor sign-in, which the app does not support yet. Sign in on the web instead."
            case .signedIn(let token, let user):
                store(token)
                self.user = user
                if user == nil { await refresh() }
            }
        } catch {
            problem = error.localizedDescription
        }
    }

    func signOut() async {
        working = true
        defer { working = false }
        try? await client.signOut()
        store("")
        user = nil
    }

    func refresh() async {
        guard signedIn else { return }
        do {
            if let user = try await client.session() {
                self.user = user
                problem = nil
            } else {
                store("")
                user = nil
                problem = "Your session has ended. Sign in again."
            }
        } catch {
            problem = error.localizedDescription
        }
    }

    private func store(_ value: String) {
        Keychain.set(value, service: Keychain.session)
        token = value
    }
}
