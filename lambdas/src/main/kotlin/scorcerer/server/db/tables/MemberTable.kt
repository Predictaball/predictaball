package scorcerer.server.db.tables

import org.jetbrains.exposed.v1.core.Table

object MemberTable : Table("member") {
    val id = varchar("id", 40).uniqueIndex()
    val firstName = varchar("firstName", 30)
    val familyName = varchar("familyName", 30)
    val fixedPoints = integer("fixed_points")
    val doublePointsChips = integer("double_points_chips").default(3)
    val oneOutChips = integer("one_out_chips").default(3)
    val crowdChips = integer("crowd_chips").default(3)
    val email = varchar("email", 255).uniqueIndex()
    val passwordHash = varchar("password_hash", 255).nullable()
    val authProvider = varchar("auth_provider", 20).default("email")
    val emailReminders = bool("email_reminders").default(false)
    val supportedTeamId = integer("supported_team_id").references(TeamTable.id).nullable()
    override val primaryKey = PrimaryKey(id)
}
