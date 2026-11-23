package com.maulanasdqn.skyla.auth

import com.maulanasdqn.skyla.data.ApiClient
import com.maulanasdqn.skyla.settings.SessionSettings
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class AuthRepositoryTest {
    private val server = MockWebServer()
    private lateinit var settings: FakeSettings
    private lateinit var auth: AuthRepository

    private class FakeSettings(private val base: String, var token: String? = null) : SessionSettings {
        override suspend fun currentBaseUrl(): String = base

        override suspend fun currentToken(): String? = token

        override suspend fun setToken(token: String?) {
            this.token = token
        }
    }

    @Before
    fun setUp() {
        server.start()
        settings = FakeSettings(server.url("/").toString().trimEnd('/'))
        auth = AuthRepository(ApiClient(settings), settings)
    }

    @After
    fun tearDown() = server.close()

    @Test
    fun `stores the token from sign-in and sends it as a bearer`() = runTest {
        server.enqueue(MockResponse.Builder().code(200).addHeader("set-auth-token", "tok-1").body("""{"token":"tok-1"}""").build())
        server.enqueue(MockResponse.Builder().code(200).body("""{"user":{"id":"u","email":"a@b.c"}}""").build())

        val result = auth.signIn("a@b.c", "pw")
        val user = auth.currentUser()

        assertEquals(SignInResult.Success("tok-1", null), result)
        assertEquals("tok-1", settings.token)
        assertEquals(AuthRepository.SIGN_IN_PATH, server.takeRequest().url.encodedPath)
        val session = server.takeRequest()
        assertEquals(AuthRepository.SESSION_PATH, session.url.encodedPath)
        assertEquals("Bearer tok-1", session.headers[ApiClient.AUTHORIZATION])
        assertEquals("a@b.c", user?.email)
    }

    @Test
    fun `clears the token when the session is rejected`() = runTest {
        settings.token = "stale"
        server.enqueue(MockResponse.Builder().code(401).build())

        assertNull(auth.currentUser())
        assertNull(settings.token)
    }

    @Test
    fun `sign-out forgets the token even when the server is gone`() = runTest {
        settings.token = "tok"
        server.close()

        auth.signOut()

        assertNull(settings.token)
    }
}
