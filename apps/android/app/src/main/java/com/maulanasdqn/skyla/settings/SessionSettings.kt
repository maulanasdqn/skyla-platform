package com.maulanasdqn.skyla.settings

interface SessionSettings {
    suspend fun currentBaseUrl(): String

    suspend fun currentToken(): String?

    suspend fun setToken(token: String?)
}
