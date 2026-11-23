package com.maulanasdqn.skyla.ui.signin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maulanasdqn.skyla.auth.AuthRepository
import com.maulanasdqn.skyla.auth.SignInResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SignInState(
    val email: String = "",
    val password: String = "",
    val pending: Boolean = false,
    val error: String? = null,
    val signedIn: Boolean = false,
)

class SignInViewModel(private val auth: AuthRepository) : ViewModel() {
    private val _state = MutableStateFlow(SignInState())
    val state: StateFlow<SignInState> = _state.asStateFlow()

    fun onEmail(value: String) = _state.update { it.copy(email = value, error = null) }

    fun onPassword(value: String) = _state.update { it.copy(password = value, error = null) }

    fun submit() {
        val current = _state.value
        if (current.pending || current.email.isBlank() || current.password.isEmpty()) return
        _state.update { it.copy(pending = true, error = null) }
        viewModelScope.launch {
            val result = auth.signIn(current.email.trim(), current.password)
            _state.update {
                when (result) {
                    is SignInResult.Success -> it.copy(pending = false, signedIn = true)
                    SignInResult.TwoFactorRequired -> it.copy(pending = false, error = TWO_FACTOR_UNSUPPORTED)
                    is SignInResult.Failure -> it.copy(pending = false, error = result.message)
                }
            }
        }
    }

    companion object {
        const val TWO_FACTOR_UNSUPPORTED =
            "This account uses two-factor authentication, which the app does not support yet. Sign in on the web."
    }
}
