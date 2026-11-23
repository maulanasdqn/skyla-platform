package com.maulanasdqn.skyla.auth

import com.maulanasdqn.skyla.data.ApiClient
import kotlinx.serialization.SerializationException

object SignInResponseParser {
    const val AUTH_TOKEN_HEADER = "set-auth-token"
    private const val FALLBACK_FAILURE = "Sign-in failed"

    fun parse(status: Int, headerToken: String?, body: String): SignInResult {
        val parsed = decode(body)
        if (status !in 200..299) {
            return SignInResult.Failure(parsed?.message ?: "$FALLBACK_FAILURE ($status)")
        }
        if (parsed?.twoFactorRedirect == true) return SignInResult.TwoFactorRequired
        val token = headerToken?.takeIf { it.isNotBlank() } ?: parsed?.token?.takeIf { it.isNotBlank() }
        return if (token == null) {
            SignInResult.Failure(FALLBACK_FAILURE)
        } else {
            SignInResult.Success(token, parsed?.user)
        }
    }

    private fun decode(body: String): SignInBody? = try {
        if (body.isBlank()) null else ApiClient.json.decodeFromString(SignInBody.serializer(), body)
    } catch (_: SerializationException) {
        null
    } catch (_: IllegalArgumentException) {
        null
    }
}
