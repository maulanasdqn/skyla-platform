package com.maulanasdqn.skyla.chat

import com.maulanasdqn.skyla.data.ApiClient
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException

object ChatStreamDecoder {
    const val EVENT_MESSAGE = "message"
    const val EVENT_ERROR = "error"
    const val EVENT_DONE = "done"

    @Serializable
    private data class Frame(
        val type: String,
        val text: String = "",
        val thinking: Boolean = false,
        val promptTokens: Int = 0,
        val completionTokens: Int = 0,
        val tokensPerSecond: Double = 0.0,
        val contextUsed: Int = 0,
        val contextSize: Int = 0,
        val message: String? = null,
    )

    @Serializable
    private data class ErrorFrame(val message: String? = null)

    fun decode(event: SseEvent): ChatEvent? = when (event.event) {
        EVENT_MESSAGE -> decodeMessage(event.data)
        EVENT_ERROR -> ChatEvent.Failure(errorMessage(event.data))
        else -> null
    }

    private fun decodeMessage(data: String): ChatEvent? {
        val frame = try {
            ApiClient.json.decodeFromString(Frame.serializer(), data)
        } catch (_: SerializationException) {
            return null
        } catch (_: IllegalArgumentException) {
            return null
        }
        return when (frame.type) {
            "token" -> ChatEvent.Token(frame.text, frame.thinking)
            "done" -> ChatEvent.Done(
                ChatStats(
                    frame.promptTokens,
                    frame.completionTokens,
                    frame.tokensPerSecond,
                    frame.contextUsed,
                    frame.contextSize,
                ),
            )
            "error" -> ChatEvent.Failure(frame.message ?: GENERIC_ERROR)
            else -> null
        }
    }

    private fun errorMessage(data: String): String = try {
        ApiClient.json.decodeFromString(ErrorFrame.serializer(), data).message ?: GENERIC_ERROR
    } catch (_: SerializationException) {
        data.ifBlank { GENERIC_ERROR }
    } catch (_: IllegalArgumentException) {
        data.ifBlank { GENERIC_ERROR }
    }

    private const val GENERIC_ERROR = "The server reported an error"
}
