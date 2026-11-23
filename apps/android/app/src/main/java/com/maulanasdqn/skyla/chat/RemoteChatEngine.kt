package com.maulanasdqn.skyla.chat

import com.maulanasdqn.skyla.data.ApiClient
import com.maulanasdqn.skyla.data.ApiException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.job
import kotlinx.coroutines.withContext

class RemoteChatEngine(private val api: ApiClient) : ChatEngine {
    override suspend fun models(): List<ModelInfo> = withContext(Dispatchers.IO) {
        val request = api.request(MODELS_PATH).get().build()
        api.http.newCall(request).execute().use { response ->
            val body = response.body.string()
            if (!response.isSuccessful) throw ApiException(response.code, body)
            ApiClient.json.decodeFromString(ModelList.serializer(), body).models
        }
    }

    override fun stream(request: ChatRequest): Flow<ChatEvent> = flow {
        val payload = ApiClient.json.encodeToString(ChatRequest.serializer(), request)
        val httpRequest = api.request(STREAM_PATH)
            .header("Accept", "text/event-stream")
            .post(ApiClient.jsonBody(payload))
            .build()
        val call = api.http.newCall(httpRequest)
        val cancel = currentCoroutineContext().job.invokeOnCompletion { call.cancel() }
        try {
            call.execute().use { response ->
                if (!response.isSuccessful) {
                    emit(ChatEvent.Failure("HTTP ${response.code}: ${response.body.string().take(200)}"))
                    return@use
                }
                val source = response.body.source()
                val parser = SseParser()
                while (true) {
                    currentCoroutineContext().ensureActive()
                    val line = source.readUtf8Line() ?: break
                    val event = parser.feed(line) ?: continue
                    if (event.event == ChatStreamDecoder.EVENT_DONE) break
                    ChatStreamDecoder.decode(event)?.let { emit(it) }
                }
                parser.finish()?.let { last -> ChatStreamDecoder.decode(last)?.let { emit(it) } }
            }
        } finally {
            cancel.dispose()
        }
    }.flowOn(Dispatchers.IO)

    companion object {
        const val MODELS_PATH = "/api/chat/models"
        const val STREAM_PATH = "/api/chat/stream"
    }
}
