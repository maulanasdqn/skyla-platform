package com.maulanasdqn.skyla.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.maulanasdqn.skyla.ui.chat.ChatScreen
import com.maulanasdqn.skyla.ui.settings.SettingsScreen
import com.maulanasdqn.skyla.ui.signin.SignInScreen
import com.maulanasdqn.skyla.ui.splash.SplashScreen

object Routes {
    const val SPLASH = "splash"
    const val SIGN_IN = "sign-in"
    const val CHAT = "chat"
    const val SETTINGS = "settings"
}

@Composable
fun SkylaNavHost(nav: NavHostController = rememberNavController()) {
    NavHost(navController = nav, startDestination = Routes.SPLASH) {
        composable(Routes.SPLASH) {
            SplashScreen(
                onSignedIn = { nav.replaceWith(Routes.CHAT) },
                onSignedOut = { nav.replaceWith(Routes.SIGN_IN) },
            )
        }
        composable(Routes.SIGN_IN) {
            SignInScreen(
                onSignedIn = { nav.replaceWith(Routes.CHAT) },
                onOpenSettings = { nav.navigate(Routes.SETTINGS) },
            )
        }
        composable(Routes.CHAT) {
            ChatScreen(
                onOpenSettings = { nav.navigate(Routes.SETTINGS) },
                onSignedOut = { nav.replaceWith(Routes.SIGN_IN) },
            )
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(onBack = { nav.popBackStack() })
        }
    }
}

private fun NavHostController.replaceWith(route: String) {
    navigate(route) {
        popUpTo(graph.id) { inclusive = true }
        launchSingleTop = true
    }
}
