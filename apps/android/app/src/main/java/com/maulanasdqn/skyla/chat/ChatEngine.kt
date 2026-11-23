package com.maulanasdqn.skyla.chat

import kotlinx.coroutines.flow.Flow

interface ChatEngine {
    suspend fun models(): List<ModelInfo>

    fun stream(request: ChatRequest): Flow<ChatEvent>
}
