package scorcerer.server.resources

import kotlinx.coroutines.runBlocking
import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.routes
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.LoginRequest
import org.openapitools.server.models.RefreshTokenRequest
import org.openapitools.server.models.ResetPasswordConfirmRequest
import org.openapitools.server.models.ResetPasswordRequest
import scorcerer.server.ApiResponseError
import scorcerer.server.auth.AuthProvider
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.fromJson
import scorcerer.server.log
import scorcerer.server.toJson

data class LoginResponse(val idToken: String, val refreshToken: String, val accessToken: String?, val userId: String, val isAdmin: Boolean)
data class CheckEmailResponse(val exists: Boolean, val provider: String?)

fun authRoutes(authProvider: AuthProvider) = routes(
    "/auth/login" bind Method.POST to { req ->
        val body: LoginRequest = req.bodyString().fromJson()
        log.info("Login attempt for ${body.email}")
        val tokens = runBlocking { authProvider.login(body.email, body.password) }
        val decoded = com.auth0.jwt.JWT.decode(tokens.idToken)
        val userId = decoded.subject
        val isAdmin = authProvider.isAdmin(body.email)
        Response(Status.OK).body(LoginResponse(tokens.idToken, tokens.refreshToken, tokens.accessToken, userId, isAdmin).toJson())
    },
    "/auth/refresh" bind Method.POST to { req ->
        val body: RefreshTokenRequest = req.bodyString().fromJson()
        val tokens = runBlocking { authProvider.refresh(body.refreshToken) }
        val decoded = com.auth0.jwt.JWT.decode(tokens.idToken)
        val userId = decoded.subject
        val email = decoded.getClaim("email").asString() ?: ""
        val isAdmin = authProvider.isAdmin(email)
        Response(Status.OK).body(LoginResponse(tokens.idToken, tokens.refreshToken, tokens.accessToken, userId, isAdmin).toJson())
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
        val member = transaction {
            MemberTable.selectAll().where { MemberTable.email eq email }.firstOrNull()
        }
        val exists = member != null || runBlocking { authProvider.emailExists(email) }
        val provider = member?.get(MemberTable.authProvider)
        Response(Status.OK).body(CheckEmailResponse(exists, provider).toJson())
    },
    "/auth/ping" bind Method.GET to { Response(Status.OK) },
)
