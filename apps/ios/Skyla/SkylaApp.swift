import SwiftUI

@main
struct SkylaApp: App {
    @StateObject private var chat = ChatModel()
    @StateObject private var studio = ImageStudio()
    @StateObject private var account = AccountModel()

    var body: some Scene {
        WindowGroup {
            TabView {
                Tab("Chat", systemImage: "bubble.left.and.text.bubble.right") {
                    ContentView()
                }
                Tab("Images", systemImage: "photo.on.rectangle.angled") {
                    ImagesView()
                }
                Tab("Account", systemImage: "person.crop.circle") {
                    AccountView()
                }
            }
            .environmentObject(chat)
            .environmentObject(studio)
            .environmentObject(account)
            .onAppear {
                studio.freeMemory = { [weak chat] in chat?.flush() }
                chat.attach(account)
            }
        }
    }
}
