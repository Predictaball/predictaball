package scorcerer.server.db.tables

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.datetime.timestampWithTimeZone

object PasswordResetTokenTable : Table("password_reset_token") {
    val id = integer("id").autoIncrement()
    val email = varchar("email", 255)
    val token = varchar("token", 100).uniqueIndex()
    val expiresAt = timestampWithTimeZone("expires_at")
    val used = bool("used").default(false)
    override val primaryKey = PrimaryKey(id)
}
