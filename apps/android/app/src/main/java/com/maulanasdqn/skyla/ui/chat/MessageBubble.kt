package com.maulanasdqn.skyla.ui.chat

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.unit.dp
import com.maulanasdqn.skyla.chat.ChatRole
import java.util.Locale

@Composable
fun MessageBubble(message: UiMessage, streaming: Boolean) {
    val isUser = message.role == ChatRole.USER
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isUser) Alignment.End else Alignment.Start,
    ) {
        Surface(
            shape = MaterialTheme.shapes.large,
            color = if (isUser) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
        ) {
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                if (message.thinking.isNotEmpty()) ThinkingSection(message.thinking)
                val body = message.content.ifEmpty { if (streaming && !isUser) "…" else "" }
                if (body.isNotEmpty()) Text(body)
                message.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
        }
        message.stats?.let { stats ->
            Text(
                text = "${stats.completionTokens} tokens · ${String.format(Locale.US, "%.1f", stats.tokensPerSecond)} tok/s",
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(top = 4.dp, start = 4.dp, end = 4.dp).alpha(0.7f),
            )
        }
    }
}

@Composable
private fun ThinkingSection(text: String) {
    var expanded by rememberSaveable { mutableStateOf(false) }
    Column(Modifier.alpha(0.6f).clickable { expanded = !expanded }) {
        Text(if (expanded) "Thinking ▾" else "Thinking ▸", style = MaterialTheme.typography.labelMedium)
        if (expanded) Text(text, style = MaterialTheme.typography.bodySmall)
    }
}
