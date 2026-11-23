package com.maulanasdqn.skyla.chat

data class SseEvent(val event: String, val data: String, val id: String? = null)

class SseParser {
    private var event: String? = null
    private var id: String? = null
    private val data = StringBuilder()
    private var hasData = false

    fun feed(rawLine: String): SseEvent? {
        val line = rawLine.removeSuffix("\r")
        if (line.isEmpty()) return dispatch()
        if (line.startsWith(":")) return null
        val colon = line.indexOf(':')
        val field = if (colon < 0) line else line.substring(0, colon)
        val value = if (colon < 0) "" else line.substring(colon + 1).removePrefix(" ")
        when (field) {
            "event" -> event = value
            "id" -> id = value
            "data" -> {
                if (hasData) data.append('\n')
                data.append(value)
                hasData = true
            }
        }
        return null
    }

    fun finish(): SseEvent? = dispatch()

    private fun dispatch(): SseEvent? {
        val result = if (hasData || event != null) {
            SseEvent(event ?: DEFAULT_EVENT, data.toString(), id)
        } else {
            null
        }
        event = null
        id = null
        data.setLength(0)
        hasData = false
        return result
    }

    companion object {
        const val DEFAULT_EVENT = "message"
    }
}
