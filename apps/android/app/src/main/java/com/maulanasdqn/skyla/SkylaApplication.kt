package com.maulanasdqn.skyla

import android.app.Application

class SkylaApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
