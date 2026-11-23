package com.maulanasdqn.skyla.chat

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SseParserTest {
    private fun parseAll(text: String): List<SseEvent> {
        val parser = SseParser()
        val events = text.split("\n").mapNotNull(parser::feed).toMutableList()
        parser.finish()?.let(events::add)
        return events
    }

    @Test
    fun `parses named events separated by blank lines`() {
        val events = parseAll("event: message\ndata: {\"a\":1}\n\nevent: done\ndata: \n\n")
        assertEquals(listOf(SseEvent("message", "{\"a\":1}"), SseEvent("done", "")), events)
    }

    @Test
    fun `defaults the event name and joins multi-line data`() {
        val events = parseAll("data: one\ndata: two\n\n")
        assertEquals(listOf(SseEvent(SseParser.DEFAULT_EVENT, "one\ntwo")), events)
    }

    @Test
    fun `ignores comments and strips carriage returns`() {
        val events = parseAll(": keep-alive\r\nid: 7\r\nevent: message\r\ndata:x\r\n\r\n")
        assertEquals(listOf(SseEvent("message", "x", "7")), events)
    }

    @Test
    fun `flushes an unterminated event on finish`() {
        val parser = SseParser()
        assertNull(parser.feed("data: tail"))
        assertEquals(SseEvent("message", "tail"), parser.finish())
        assertNull(parser.finish())
    }
}
