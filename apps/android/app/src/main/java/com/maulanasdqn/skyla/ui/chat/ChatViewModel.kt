package com.maulanasdqn.skyla.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maulanasdqn.skyla.auth.AuthRepository
import com.maulanasdqn.skyla.chat.ChatEngine
import com.maulanasdqn.skyla.chat.ChatEvent
import com.maulanasdqn.skyla.chat.ChatMessage
import com.maulanasdqn.skyla.chat.ChatRequest
import com.maulanasdqn.skyla.chat.ChatRole
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException

class ChatViewModel(
    private val engine: ChatEngine,
    private val auth: AuthRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state.asStateFlow()
    private var streamJob: Job? = null
    private var nextId = 0L

    init {
        loadModels()
    }

    fun loadModels() {
        viewModelScope.launch {
            try {
                val models = engine.models()
                _state.update { s ->
                    s.copy(
                        models = models,
                        modelsError = null,
                        selectedModel = s.selectedModel ?: (models.firstOrNull { it.loaded } ?: models.firstOrNull { it.supported })?.id,
                    )
                }
            } catch (error: IOException) {
                _state.update { it.copy(modelsError = error.message ?: error.javaClass.simpleName) }
            } catch (error: Exception) {
                if (error is CancellationException) throw error
                _state.update { it.copy(modelsError = error.message ?: error.javaClass.simpleName) }
            }
        }
    }

    fun onInput(value: String) = _state.update { it.copy(input = value) }

    fun selectModel(id: String) = _state.update { it.copy(selectedModel = id) }

    fun send() {
        val current = _state.value
        val text = current.input.trim()
        if (text.isEmpty() || current.streaming) return
        val user = UiMessage(nextId++, ChatRole.USER, content = text)
        val reply = UiMessage(nextId++, ChatRole.ASSISTANT)
        val history = current.messages.filter { it.error == null && it.content.isNotBlank() } + user
        _state.update { it.copy(messages = it.messages + user + reply, input = "", streaming = true) }
        val request = ChatRequest(
            model = current.selectedModel,
            messages = history.map { ChatMessage(it.role, it.content) },
        )
        streamJob = viewModelScope.launch {
            try {
                engine.stream(request).collect { event -> apply(reply.id, event) }
            } catch (error: IOException) {
                apply(reply.id, ChatEvent.Failure(error.message ?: error.javaClass.simpleName))
            } finally {
                _state.update { it.copy(streaming = false) }
            }
        }
    }

    fun stop() {
        streamJob?.cancel()
        streamJob = null
    }

    fun newChat() {
        stop()
        _state.update { it.copy(messages = emptyList(), input = "") }
    }

    fun signOut() {
        stop()
        viewModelScope.launch {
            auth.signOut()
            _state.update { it.copy(signedOut = true) }
        }
    }

    private fun apply(id: Long, event: ChatEvent) = _state.update { s ->
        s.copy(messages = s.messages.map { if (it.id == id) reduce(it, event) else it })
    }

    companion object {
        fun reduce(message: UiMessage, event: ChatEvent): UiMessage = when (event) {
            is ChatEvent.Token ->
                if (event.thinking) message.copy(thinking = message.thinking + event.text)
                else message.copy(content = message.content + event.text)
            is ChatEvent.Done -> message.copy(stats = event.stats)
            is ChatEvent.Failure -> message.copy(error = event.message)
        }
    }
}
