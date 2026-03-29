package scorcerer.utils

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.sum
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.update
import org.openapitools.server.models.State
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.MemberTable.livePoints
import scorcerer.server.db.tables.PredictionTable

fun recalculateLivePoints() {
    transaction {
        val liveMatchIds = MatchTable.selectAll().where { MatchTable.state eq State.LIVE }.map { it[MatchTable.id] }

        val livePointsByUser = PredictionTable
            .select(PredictionTable.memberId, PredictionTable.points.sum())
            .where { PredictionTable.matchId inList liveMatchIds }
            .groupBy(PredictionTable.memberId).associate { row ->
                row[PredictionTable.memberId] to (row[PredictionTable.points.sum()] ?: 0)
            }

        val allUserIds = MemberTable.selectAll().map { it[MemberTable.id] }

        allUserIds.forEach { userId ->
            val totalLivePoints = livePointsByUser[userId] ?: 0
            MemberTable.update({ MemberTable.id eq userId }) {
                it[livePoints] = totalLivePoints
            }
        }
    }
}
