import SwiftUI

struct AccountView: View {
    @EnvironmentObject private var account: AccountModel
    @EnvironmentObject private var chat: ChatModel
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Server address", text: $account.serverURL)
                        .keyboardType(.URL)
                        .textContentType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .disabled(account.signedIn)
                } header: {
                    Text("Server")
                } footer: {
                    Text("The Skyla platform API, for example http://192.168.1.10:3001.")
                }
                if account.signedIn {
                    Section("Signed in") {
                        LabeledContent("Email", value: account.user?.email ?? "…")
                        if let name = account.user?.name, !name.isEmpty {
                            LabeledContent("Name", value: name)
                        }
                        Button("Sign out", role: .destructive) {
                            Task {
                                await account.signOut()
                                chat.accountChanged()
                            }
                        }
                        .disabled(account.working)
                    }
                } else {
                    Section("Sign in") {
                        TextField("Email", text: $email)
                            .keyboardType(.emailAddress)
                            .textContentType(.username)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                        SecureField("Password", text: $password)
                            .textContentType(.password)
                        Button {
                            Task {
                                await account.signIn(email: email, password: password)
                                if account.signedIn {
                                    password = ""
                                    chat.accountChanged()
                                }
                            }
                        } label: {
                            HStack {
                                Text("Sign in")
                                if account.working {
                                    Spacer()
                                    ProgressView()
                                }
                            }
                        }
                        .disabled(account.working || email.isEmpty || password.isEmpty)
                    }
                }
                if let problem = account.problem {
                    Section {
                        Label(problem, systemImage: "exclamationmark.triangle.fill")
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("Account")
            .task { await account.refresh() }
        }
    }
}
