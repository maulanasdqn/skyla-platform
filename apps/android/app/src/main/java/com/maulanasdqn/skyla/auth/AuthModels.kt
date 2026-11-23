package com.maulanasdqn.skyla.auth

import kotlinx.serialization.Serializable

@Serializable
data class SignInRequest(val email: String, val password: String)

@Serializable
data class AuthUser(val id: String, val email: String, val name: String? = null)

@Serializable
data class SignInBody(
    val token: String? = null,
    val user: AuthUser? = null,
    val twoFactorRedirect: Boolean = false,
    val message: String? = null,
)

@Serializable
data class SessionBody(val user: AuthUser? = null)

sealed interface SignInResult {
    data class Success(val token: String, val user: AuthUser?) : SignInResult
    data object TwoFactorRequired : SignInResult
    data class Failure(val message: String) : SignInResult
}
