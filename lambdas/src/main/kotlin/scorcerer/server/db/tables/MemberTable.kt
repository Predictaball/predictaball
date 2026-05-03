package scorcerer.server.db.tables

import org.jetbrains.exposed.v1.core.Table

object MemberTable : Table("member") {
    val id = varchar("id", 40).uniqueIndex()
    val firstName = varchar("firstName", 30)
    val familyName = varchar("familyName", 30)
    val fixedPoints = integer("fixed_points")
    val doublePointsChips = integer("double_points_chips").default(3)
    val oneOutChips = integer("one_out_chips").default(3)
    override val primaryKey = PrimaryKey(id)
}
