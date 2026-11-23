package com.maulanasdqn.skyla.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maulanasdqn.skyla.settings.SettingsStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SettingsState(val baseUrl: String = "", val saved: Boolean = false)

class SettingsViewModel(private val settings: SettingsStore) : ViewModel() {
    private val _state = MutableStateFlow(SettingsState())
    val state: StateFlow<SettingsState> = _state.asStateFlow()

    init {
        viewModelScope.launch { _state.update { it.copy(baseUrl = settings.baseUrl.first()) } }
    }

    fun onBaseUrl(value: String) = _state.update { it.copy(baseUrl = value, saved = false) }

    fun save() {
        val url = _state.value.baseUrl
        if (!url.startsWith("http://") && !url.startsWith("https://")) return
        viewModelScope.launch {
            settings.setBaseUrl(url)
            _state.update { it.copy(saved = true) }
        }
    }
}
