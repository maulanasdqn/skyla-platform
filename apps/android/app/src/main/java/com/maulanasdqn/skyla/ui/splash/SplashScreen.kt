package com.maulanasdqn.skyla.ui.splash

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import com.maulanasdqn.skyla.auth.AuthRepository
import com.maulanasdqn.skyla.ui.containerFactory

class SplashViewModel(private val auth: AuthRepository) : ViewModel() {
    suspend fun isSignedIn(): Boolean = auth.currentUser() != null
}

@Composable
fun SplashScreen(
    onSignedIn: () -> Unit,
    onSignedOut: () -> Unit,
    viewModel: SplashViewModel = viewModel(factory = containerFactory { SplashViewModel(it.auth) }),
) {
    LaunchedEffect(Unit) {
        if (viewModel.isSignedIn()) onSignedIn() else onSignedOut()
    }
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}
