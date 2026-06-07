package scorcerer.server.auth

import at.favre.lib.crypto.bcrypt.BCrypt
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import org.http4k.core.Response
import org.http4k.core.Status
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import scorcerer.server.ApiResponseError
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.services.PasswordResetService
import scorcerer.utils.capitaliseName
import java.util.Date
import java.util.UUID

class DatabaseAuthProvider : AuthProvider {

    override suspend fun signup(email: String, pw: String, firstName: String, familyName: String, emailReminders: Boolean, supportedTeamId: Int): String {
        val userId = UUID.randomUUID().toString()
        transaction {
            MemberTable.insert {
                it[id] = userId
                it[MemberTable.firstName] = firstName.capitaliseName()
                it[MemberTable.familyName] = familyName.capitaliseName()
                it[MemberTable.email] = email
                it[passwordHash] = hashPassword(pw)
                it[fixedPoints] = 0
                it[authProvider] = "email"
                it[MemberTable.emailReminders] = emailReminders
                it[MemberTable.supportedTeamId] = supportedTeamId
            }
        }
        return userId
    }

    override suspend fun login(email: String, password: String): AuthTokens {
        val member = transaction {
            MemberTable.selectAll().where { MemberTable.email eq email }.firstOrNull()
        } ?: throw ApiResponseError(Response(Status.UNAUTHORIZED).body("User not found"))

        val hash = member[MemberTable.passwordHash]
            ?: throw ApiResponseError(Response(Status.UNAUTHORIZED).body("This account uses Google sign-in"))

        if (!verifyPassword(password, hash)) {
            throw ApiResponseError(Response(Status.UNAUTHORIZED).body("Invalid password"))
        }

        return generateTokens(member[MemberTable.id], email, member[MemberTable.firstName], member[MemberTable.familyName])
    }

    override suspend fun refresh(refreshToken: String): AuthTokens {
        val decoded = JWT.decode(refreshToken)
        val email = decoded.getClaim("email").asString()
        val member = transaction {
            MemberTable.selectAll().where { MemberTable.email eq email }.firstOrNull()
        } ?: throw ApiResponseError(Response(Status.UNAUTHORIZED).body("User not found"))

        return generateTokens(member[MemberTable.id], email, member[MemberTable.firstName], member[MemberTable.familyName])
    }

    override suspend fun emailExists(email: String): Boolean = transaction {
        MemberTable.selectAll().where { MemberTable.email eq email }.count() > 0
    }

    override suspend fun resetPassword(email: String) = PasswordResetService.requestReset(email)

    override suspend fun confirmReset(email: String, code: String, newPassword: String) =
        PasswordResetService.confirmReset(email, code, hashPassword(newPassword))

    override suspend fun generateTokensForOAuth(userId: String, email: String, firstName: String, familyName: String): AuthTokens =
        generateTokens(userId, email, firstName, familyName)

    override fun isAdmin(email: String): Boolean = adminEmails.contains(email)

    private val adminEmails = (System.getenv("LOCAL_ADMIN_EMAILS") ?: "").split(",").map { it.trim() }.filter { it.isNotEmpty() }

    private fun generateTokens(userId: String, email: String, firstName: String, familyName: String): AuthTokens {
        val now = Date()
        val expiry = Date(now.time + 24 * 60 * 60 * 1000)
        val idToken = JWT.create()
            .withSubject(userId)
            .withClaim("email", email)
            .withClaim("given_name", firstName)
            .withClaim("family_name", familyName)
            .withClaim("custom:isAdmin", if (isAdmin(email)) "true" else "false")
            .withIssuedAt(now)
            .withExpiresAt(expiry)
            .sign(algorithm)
        val refreshToken = JWT.create()
            .withClaim("email", email)
            .withIssuedAt(now)
            .withExpiresAt(Date(now.time + 30L * 24 * 60 * 60 * 1000))
            .sign(algorithm)
        return AuthTokens(idToken, null, refreshToken)
    }

    companion object {
        val SECRET: String = System.getenv("NEXTAUTH_SECRET") ?: "local-dev-secret"
        val algorithm: Algorithm = Algorithm.HMAC256(SECRET)
        private const val BCRYPT_COST = 12

        fun hashPassword(password: String): String =
            BCrypt.withDefaults().hashToString(BCRYPT_COST, password.toCharArray())

        fun verifyPassword(password: String, hash: String): Boolean =
            BCrypt.verifyer().verify(password.toCharArray(), hash).verified
    }
}
