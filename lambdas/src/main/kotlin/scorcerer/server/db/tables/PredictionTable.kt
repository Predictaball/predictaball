package scorcerer.server.db.tables

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.lessEq

object PredictionTable : Table("prediction") {
    val id = integer("id").uniqueIndex().autoIncrement()
    val memberId = varchar("member_id", 40).references(MemberTable.id)
    val matchId = integer("match_id").references(MatchTable.id)
    val homeScore = integer("home_score").check { it.greaterEq(0) }
    val awayScore = integer("away_score").check { it.greaterEq(0) }
    val result = enumeration<MatchResult>("result").nullable()
    val points = integer("points").check { it.greaterEq(0) }.check { it.lessEq(10) }.nullable()
    init {
        uniqueIndex(memberId, matchId)
    }
    override val primaryKey = PrimaryKey(id)
}
