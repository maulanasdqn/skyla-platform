package com.maulanasdqn.skyla.settings

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "skyla")

class SettingsStore(private val context: Context) : SessionSettings {
    private val baseUrlKey = stringPreferencesKey("base_url")
    private val tokenKey = stringPreferencesKey("session_token")

    val baseUrl: Flow<String> = context.dataStore.data.map { it[baseUrlKey] ?: DEFAULT_BASE_URL }
    val token: Flow<String?> = context.dataStore.data.map { it[tokenKey] }

    override suspend fun currentBaseUrl(): String = baseUrl.first().trimEnd('/')

    override suspend fun currentToken(): String? = token.first()

    suspend fun setBaseUrl(url: String) {
        context.dataStore.edit { it[baseUrlKey] = url.trim().trimEnd('/') }
    }

    override suspend fun setToken(token: String?) {
        context.dataStore.edit { prefs ->
            if (token == null) prefs.remove(tokenKey) else prefs[tokenKey] = token
        }
    }

    companion object {
        const val DEFAULT_BASE_URL = "http://10.0.2.2:3001"
    }
}
