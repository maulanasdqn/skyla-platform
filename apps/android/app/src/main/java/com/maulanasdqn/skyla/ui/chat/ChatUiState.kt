package com.maulanasdqn.skyla.ui.chat

import com.maulanasdqn.skyla.chat.ChatRole
import com.maulanasdqn.skyla.chat.ChatStats
import com.maulanasdqn.skyla.chat.ModelInfo

data class UiMessage(
    val id: Long,
    val role: ChatRole,
    val content: String = "",
    val thinking: String = "",
    val stats: ChatStats? = null,
    val error: String? = null,
)

data class ChatUiState(
    val messages: List<UiMessage> = emptyList(),
    val input: String = "",
    val streaming: Boolean = false,
    val models: List<ModelInfo> = emptyList(),
    val selectedModel: String? = null,
    val modelsError: String? = null,
    val signedOut: Boolean = false,
)
