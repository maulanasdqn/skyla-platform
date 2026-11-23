package com.maulanasdqn.skyla

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.maulanasdqn.skyla.ui.SkylaNavHost
import com.maulanasdqn.skyla.ui.theme.SkylaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SkylaTheme {
                SkylaNavHost()
            }
        }
    }
}
