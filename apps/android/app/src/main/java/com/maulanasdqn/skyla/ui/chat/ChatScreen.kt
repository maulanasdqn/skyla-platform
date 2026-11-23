package com.maulanasdqn.skyla.ui.chat

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.maulanasdqn.skyla.ui.containerFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    onOpenSettings: () -> Unit,
    onSignedOut: () -> Unit,
    viewModel: ChatViewModel = viewModel(factory = containerFactory { ChatViewModel(it.chat, it.auth) }),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val list = rememberLazyListState()
    LaunchedEffect(state.signedOut) { if (state.signedOut) onSignedOut() }
    LaunchedEffect(state.messages.size, state.messages.lastOrNull()?.content?.length) {
        if (state.messages.isNotEmpty()) list.scrollToItem(state.messages.lastIndex)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { ModelPicker(state.models, state.selectedModel, viewModel::selectModel) },
                actions = {
                    TextButton(onClick = viewModel::newChat) { Text("New") }
                    TextButton(onClick = onOpenSettings) { Text("Settings") }
                    TextButton(onClick = viewModel::signOut) { Text("Sign out") }
                },
            )
        },
        modifier = Modifier.imePadding(),
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            state.modelsError?.let {
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.weight(1f))
                    TextButton(onClick = viewModel::loadModels) { Text("Retry") }
                }
            }
            LazyColumn(
                state = list,
                modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.messages, key = { it.id }) { message ->
                    MessageBubble(message, streaming = state.streaming && message == state.messages.last())
                }
            }
            Composer(
                input = state.input,
                streaming = state.streaming,
                onInput = viewModel::onInput,
                onSend = viewModel::send,
                onStop = viewModel::stop,
            )
        }
    }
}

@Composable
private fun Composer(input: String, streaming: Boolean, onInput: (String) -> Unit, onSend: () -> Unit, onStop: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        OutlinedTextField(
            value = input,
            onValueChange = onInput,
            placeholder = { Text("Message") },
            modifier = Modifier.weight(1f),
            maxLines = 5,
        )
        if (streaming) {
            OutlinedButton(onClick = onStop) { Text("Stop") }
        } else {
            Button(onClick = onSend, enabled = input.isNotBlank()) { Text("Send") }
        }
    }
}
