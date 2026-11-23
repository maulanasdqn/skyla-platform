package com.maulanasdqn.skyla.auth

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SignInResponseParserTest {
    @Test
    fun `prefers the set-auth-token header`() {
        val result = SignInResponseParser.parse(200, "header-token", """{"token":"body-token","user":{"id":"1","email":"a@b.c"}}""")
        assertEquals(SignInResult.Success("header-token", AuthUser("1", "a@b.c")), result)
    }

    @Test
    fun `falls back to the body token`() {
        val result = SignInResponseParser.parse(200, null, """{"token":"body-token"}""")
        assertEquals(SignInResult.Success("body-token", null), result)
    }

    @Test
    fun `reports two-factor redirects`() {
        val result = SignInResponseParser.parse(200, null, """{"twoFactorRedirect":true}""")
        assertEquals(SignInResult.TwoFactorRequired, result)
    }

    @Test
    fun `surfaces the server message on failure`() {
        val result = SignInResponseParser.parse(401, null, """{"message":"Invalid email or password"}""")
        assertEquals(SignInResult.Failure("Invalid email or password"), result)
    }

    @Test
    fun `fails when no token is present`() {
        assertTrue(SignInResponseParser.parse(200, "", "") is SignInResult.Failure)
        assertTrue(SignInResponseParser.parse(500, null, "<html>") is SignInResult.Failure)
    }
}
