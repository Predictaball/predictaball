package scorcerer.server.resources

import kotlinx.coroutines.runBlocking
import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.routes
import org.openapitools.server.models.CheckEmail200Response
import org.openapitools.server.models.Login200Response
import org.openapitools.server.models.LoginRequest
import org.openapitools.server.models.RefreshTokenRequest
import org.openapitools.server.models.ResetPasswordConfirmRequest
import org.openapitools.server.models.ResetPasswordRequest
import scorcerer.server.ApiResponseError
import scorcerer.server.auth.AuthProvider
import scorcerer.server.fromJson
import scorcerer.server.log
import scorcerer.server.toJson

fun authRoutes(authProvider: AuthProvider) = routes(
    "/auth/login" bind Method.POST to { req ->
        val body: LoginRequest = req.bodyString().fromJson()
        log.info("Login attempt for ${body.email}")
        val tokens = runBlocking { authProvider.login(body.email, body.password) }
        Response(Status.OK).body(Login200Response(tokens.idToken, tokens.refreshToken, tokens.accessToken).toJson())
    },
    "/auth/refresh" bind Method.POST to { req ->
        val body: RefreshTokenRequest = req.bodyString().fromJson()
        val tokens = runBlocking { authProvider.refresh(body.refreshToken) }
        Response(Status.OK).body(Login200Response(tokens.idToken, tokens.refreshToken, tokens.accessToken).toJson())
    },
    "/auth/reset" bind Method.POST to { req ->
        val body: ResetPasswordRequest = req.bodyString().fromJson()
        log.info("Resetting password for ${body.email}")
        runBlocking {
            try {
                authProvider.resetPassword(body.email)
            } catch (e: Exception) {
                log.error("Failed to reset password - $e")
                throw ApiResponseError(Response(Status.BAD_REQUEST).body("Failed to reset password"))
            }
        }
        Response(Status.OK)
    },
    "/auth/reset-confirm" bind Method.POST to { req ->
        val body: ResetPasswordConfirmRequest = req.bodyString().fromJson()
        log.info("Confirming password reset for ${body.email}")
        runBlocking {
            try {
                authProvider.confirmReset(body.email, body.otp, body.password)
            } catch (e: Exception) {
                log.error("Failed to confirm password reset - $e")
                throw ApiResponseError(Response(Status.BAD_REQUEST).body("Failed to reset password"))
            }
        }
        Response(Status.OK)
    },
    "/auth/check-email" bind Method.GET to { req ->
        val email = req.query("email")
            ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("email query parameter is required"))
        val exists = runBlocking { authProvider.emailExists(email) }
        Response(Status.OK).body(CheckEmail200Response(exists).toJson())
    },
    "/auth/ping" bind Method.GET to { Response(Status.OK) },
)
