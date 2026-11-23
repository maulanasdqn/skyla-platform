package com.maulanasdqn.skyla.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.maulanasdqn.skyla.AppContainer
import com.maulanasdqn.skyla.SkylaApplication

inline fun <reified T : ViewModel> containerFactory(crossinline build: (AppContainer) -> T) = viewModelFactory {
    initializer { build((this[APPLICATION_KEY] as SkylaApplication).container) }
}
