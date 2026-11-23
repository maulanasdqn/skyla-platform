package com.maulanasdqn.skyla

import android.content.Context
import com.maulanasdqn.skyla.auth.AuthRepository
import com.maulanasdqn.skyla.chat.ChatEngine
import com.maulanasdqn.skyla.chat.RemoteChatEngine
import com.maulanasdqn.skyla.data.ApiClient
import com.maulanasdqn.skyla.settings.SettingsStore

class AppContainer(context: Context) {
    val settings = SettingsStore(context)
    private val api = ApiClient(settings)
    val auth = AuthRepository(api, settings)
    val chat: ChatEngine = RemoteChatEngine(api)
}
