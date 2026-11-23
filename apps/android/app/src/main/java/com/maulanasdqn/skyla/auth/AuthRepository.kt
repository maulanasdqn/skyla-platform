package com.maulanasdqn.skyla.auth

import com.maulanasdqn.skyla.data.ApiClient
import com.maulanasdqn.skyla.settings.SessionSettings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import okhttp3.Response
import java.io.IOException

class AuthRepository(
    private val api: ApiClient,
    private val settings: SessionSettings,
) {
    suspend fun signIn(email: String, password: String): SignInResult = withContext(Dispatchers.IO) {
        val payload = ApiClient.json.encodeToString(SignInRequest.serializer(), SignInRequest(email, password))
        val request = api.request(SIGN_IN_PATH).post(ApiClient.jsonBody(payload)).build()
        val result = try {
            api.http.newCall(request).execute().use { response ->
                SignInResponseParser.parse(
                    response.code,
                    response.header(SignInResponseParser.AUTH_TOKEN_HEADER),
                    response.body.string(),
                )
            }
        } catch (error: IOException) {
            SignInResult.Failure(error.message ?: error.javaClass.simpleName)
        }
        if (result is SignInResult.Success) settings.setToken(result.token)
        result
    }

    suspend fun currentUser(): AuthUser? = withContext(Dispatchers.IO) {
        if (settings.currentToken() == null) return@withContext null
        val request = api.request(SESSION_PATH).get().build()
        try {
            api.http.newCall(request).execute().use { response -> sessionUser(response) }
        } catch (_: IOException) {
            null
        }
    }

    suspend fun signOut() = withContext(Dispatchers.IO) {
        val request = api.request(SIGN_OUT_PATH).post(ApiClient.jsonBody("{}")).build()
        try {
            api.http.newCall(request).execute().close()
        } catch (_: IOException) {
        }
        settings.setToken(null)
    }

    private suspend fun sessionUser(response: Response): AuthUser? {
        if (response.code == 401) {
            settings.setToken(null)
            return null
        }
        val body = response.body.string()
        if (!response.isSuccessful || body.isBlank() || body == "null") return null
        return try {
            ApiClient.json.decodeFromString(SessionBody.serializer(), body).user
        } catch (_: SerializationException) {
            null
        }
    }

    companion object {
        const val SIGN_IN_PATH = "/api/auth/sign-in/email"
        const val SIGN_OUT_PATH = "/api/auth/sign-out"
        const val SESSION_PATH = "/api/auth/get-session"
    }
}
