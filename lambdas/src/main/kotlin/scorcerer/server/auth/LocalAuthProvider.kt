package scorcerer.server.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import org.http4k.core.Response
import org.http4k.core.Status
import scorcerer.server.ApiResponseError
import java.util.Date
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

class LocalAuthProvider : AuthProvider {
    private val users = ConcurrentHashMap<String, LocalUser>()

    data class LocalUser(
        val id: String,
        val email: String,
        val password: String,
        val firstName: String,
        val familyName: String,
    )

    override suspend fun signup(email: String, pw: String, firstName: String, familyName: String): String {
        if (users.containsKey(email)) {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("User already exists"))
        }
        val userId = UUID.randomUUID().toString()
        users[email] = LocalUser(userId, email, pw, firstName, familyName)
        return userId
    }

    override suspend fun login(email: String, password: String): AuthTokens {
        val user = users[email]
            ?: throw ApiResponseError(Response(Status.UNAUTHORIZED).body("User not found"))
        if (user.password != password) {
            throw ApiResponseError(Response(Status.UNAUTHORIZED).body("Invalid password"))
        }
        return generateTokens(user)
    }

    override suspend fun refresh(refreshToken: String): AuthTokens {
        val decoded = JWT.decode(refreshToken)
        val email = decoded.getClaim("email").asString()
        val user = users[email]
            ?: throw ApiResponseError(Response(Status.UNAUTHORIZED).body("User not found"))
        return generateTokens(user)
    }

    override suspend fun emailExists(email: String): Boolean = users.containsKey(email)

    override suspend fun resetPassword(email: String) {}

    override suspend fun confirmReset(email: String, code: String, newPassword: String) {
        val user = users[email] ?: return
        users[email] = user.copy(password = newPassword)
    }

    private val adminEmails = (System.getenv("LOCAL_ADMIN_EMAILS") ?: "").split(",").map { it.trim() }.filter { it.isNotEmpty() }

    private fun generateTokens(user: LocalUser): AuthTokens {
        val now = Date()
        val expiry = Date(now.time + 24 * 60 * 60 * 1000)
        val isAdmin = adminEmails.contains(user.email)
        val idToken = JWT.create()
            .withSubject(user.id)
            .withClaim("email", user.email)
            .withClaim("given_name", user.firstName)
            .withClaim("family_name", user.familyName)
            .withClaim("cognito:username", user.email)
            .withClaim("custom:isAdmin", if (isAdmin) "true" else "false")
            .withIssuedAt(now)
            .withExpiresAt(expiry)
            .sign(algorithm)
        val refreshToken = JWT.create()
            .withClaim("email", user.email)
            .withIssuedAt(now)
            .withExpiresAt(Date(now.time + 30L * 24 * 60 * 60 * 1000))
            .sign(algorithm)
        return AuthTokens(idToken, null, refreshToken)
    }

    companion object {
        const val SECRET = "local-dev-secret"
        val algorithm: Algorithm = Algorithm.HMAC256(SECRET)
    }
}
