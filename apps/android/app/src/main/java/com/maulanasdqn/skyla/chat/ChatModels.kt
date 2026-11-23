package com.maulanasdqn.skyla.chat

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class ChatRole {
    @SerialName("system") SYSTEM,
    @SerialName("user") USER,
    @SerialName("assistant") ASSISTANT,
}

@Serializable
data class ChatMessage(val role: ChatRole, val content: String)

@Serializable
data class ChatRequest(
    val model: String? = null,
    val messages: List<ChatMessage>,
    val temperature: Float? = null,
    val topP: Float? = null,
    val maxTokens: Int? = null,
)

@Serializable
data class ModelInfo(
    val id: String,
    val name: String,
    val architecture: String = "",
    val sizeGb: Double = 0.0,
    val supported: Boolean = true,
    val loaded: Boolean = false,
)

@Serializable
data class ModelList(val models: List<ModelInfo> = emptyList())

@Serializable
data class ChatStats(
    val promptTokens: Int = 0,
    val completionTokens: Int = 0,
    val tokensPerSecond: Double = 0.0,
    val contextUsed: Int = 0,
    val contextSize: Int = 0,
)

sealed interface ChatEvent {
    data class Token(val text: String, val thinking: Boolean) : ChatEvent
    data class Done(val stats: ChatStats) : ChatEvent
    data class Failure(val message: String) : ChatEvent
}
