package com.maulanasdqn.skyla.chat

import com.maulanasdqn.skyla.ui.chat.ChatViewModel
import com.maulanasdqn.skyla.ui.chat.UiMessage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ChatStreamDecoderTest {
    @Test
    fun `decodes token frames`() {
        val event = ChatStreamDecoder.decode(SseEvent("message", """{"type":"token","text":"Hi","thinking":true}"""))
        assertEquals(ChatEvent.Token("Hi", thinking = true), event)
    }

    @Test
    fun `decodes done frames into stats`() {
        val data = """{"type":"done","promptTokens":5,"completionTokens":12,"tokensPerSecond":20.5,"contextUsed":17,"contextSize":4096}"""
        val event = ChatStreamDecoder.decode(SseEvent("message", data))
        assertEquals(ChatEvent.Done(ChatStats(5, 12, 20.5, 17, 4096)), event)
    }

    @Test
    fun `turns error events into failures`() {
        val event = ChatStreamDecoder.decode(SseEvent("error", """{"message":"no model loaded"}"""))
        assertEquals(ChatEvent.Failure("no model loaded"), event)
    }

    @Test
    fun `skips unknown or malformed frames`() {
        assertNull(ChatStreamDecoder.decode(SseEvent("message", "not json")))
        assertNull(ChatStreamDecoder.decode(SseEvent("message", """{"type":"ping"}""")))
        assertNull(ChatStreamDecoder.decode(SseEvent("other", "{}")))
    }

    @Test
    fun `reducer splits thinking from the answer`() {
        val start = UiMessage(1, ChatRole.ASSISTANT)
        val result = listOf(
            ChatEvent.Token("hmm", thinking = true),
            ChatEvent.Token("4", thinking = false),
            ChatEvent.Done(ChatStats(completionTokens = 2)),
        ).fold(start, ChatViewModel::reduce)
        assertEquals("hmm", result.thinking)
        assertEquals("4", result.content)
        assertEquals(2, result.stats?.completionTokens)
    }
}
