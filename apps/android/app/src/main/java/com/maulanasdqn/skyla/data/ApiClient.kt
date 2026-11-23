package com.maulanasdqn.skyla.data

import com.maulanasdqn.skyla.settings.SessionSettings
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class ApiClient(
    private val settings: SessionSettings,
    val http: OkHttpClient = defaultClient(),
) {
    suspend fun request(path: String): Request.Builder {
        val builder = Request.Builder().url(settings.currentBaseUrl() + path)
        settings.currentToken()?.let { builder.header(AUTHORIZATION, bearer(it)) }
        return builder
    }

    companion object {
        const val AUTHORIZATION = "Authorization"
        private val JSON_MEDIA = "application/json".toMediaType()

        val json = Json {
            ignoreUnknownKeys = true
            explicitNulls = false
            encodeDefaults = false
        }

        fun bearer(token: String): String = "Bearer $token"

        fun jsonBody(text: String): RequestBody = text.toRequestBody(JSON_MEDIA)

        fun defaultClient(): OkHttpClient = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.SECONDS)
            .build()
    }
}
