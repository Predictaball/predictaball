package scorcerer.server.services

import org.http4k.core.Response
import org.http4k.core.Status
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.update
import scorcerer.server.ApiResponseError
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PasswordResetTokenTable
import scorcerer.server.log
import java.security.SecureRandom
import java.time.OffsetDateTime

object PasswordResetService {

    fun requestReset(email: String) {
        val member = transaction {
            MemberTable.selectAll().where { MemberTable.email eq email }.firstOrNull()
        } ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("No user found for this email"))

        if (member[MemberTable.authProvider] != "email") {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("This account uses Google sign-in"))
        }

        val code = generateCode()
        transaction {
            PasswordResetTokenTable.insert {
                it[PasswordResetTokenTable.email] = email
                it[token] = code
                it[expiresAt] = OffsetDateTime.now().plusHours(1)
            }
        }

        EmailService.send(
            to = email,
            subject = "Reset your password",
            html = "<h2>Reset your password</h2><p>Your verification code is:</p><h1 style='letter-spacing: 8px; font-size: 36px;'>$code</h1><p>This code expires in 1 hour.</p><p>If you didn't request this, you can ignore this email.</p>",
        )
    }

    fun confirmReset(email: String, code: String, newPasswordHash: String) {
        val resetToken = transaction {
            PasswordResetTokenTable.selectAll().where {
                (PasswordResetTokenTable.token eq code) and
                    (PasswordResetTokenTable.email eq email) and
                    (PasswordResetTokenTable.used eq false)
            }.firstOrNull()
        } ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Invalid or expired code"))

        if (resetToken[PasswordResetTokenTable.expiresAt] < OffsetDateTime.now()) {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("Reset code has expired"))
        }

        transaction {
            PasswordResetTokenTable.update({ PasswordResetTokenTable.token eq code }) {
                it[used] = true
            }
            MemberTable.update({ MemberTable.email eq email }) {
                it[passwordHash] = newPasswordHash
            }
        }

        log.info("Password reset completed for $email")
    }

    private fun generateCode(): String {
        val random = SecureRandom()
        return (1..6).map { random.nextInt(10) }.joinToString("")
    }
}
