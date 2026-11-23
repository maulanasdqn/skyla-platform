package com.maulanasdqn.skyla.ui.chat

import androidx.compose.foundation.layout.Box
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.maulanasdqn.skyla.chat.ModelInfo

@Composable
fun ModelPicker(models: List<ModelInfo>, selected: String?, onSelect: (String) -> Unit) {
    var open by remember { mutableStateOf(false) }
    val label = models.firstOrNull { it.id == selected }?.name ?: "Model"
    Box {
        TextButton(onClick = { open = true }, enabled = models.isNotEmpty()) { Text("$label ▾", maxLines = 1) }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            models.forEach { model ->
                DropdownMenuItem(
                    text = { Text(if (model.supported) model.name else "${model.name} (unsupported)") },
                    enabled = model.supported,
                    onClick = {
                        onSelect(model.id)
                        open = false
                    },
                )
            }
        }
    }
}
