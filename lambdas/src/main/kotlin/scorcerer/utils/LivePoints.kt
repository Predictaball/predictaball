package scorcerer.utils

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.sum
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.openapitools.server.models.Match
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.PredictionTable

fun livePointsByUser(): Map<String, Int> {
    val liveMatchIds = MatchTable.selectAll().where { MatchTable.state eq Match.State.LIVE }.map { it[MatchTable.id] }
    if (liveMatchIds.isEmpty()) return emptyMap()
    return PredictionTable
        .select(PredictionTable.memberId, PredictionTable.points.sum())
        .where { PredictionTable.matchId inList liveMatchIds }
        .groupBy(PredictionTable.memberId)
        .associate { it[PredictionTable.memberId] to (it[PredictionTable.points.sum()] ?: 0) }
}

fun livePointsForUser(userId: String): Int {
    val liveMatchIds = MatchTable.selectAll().where { MatchTable.state eq Match.State.LIVE }.map { it[MatchTable.id] }
    if (liveMatchIds.isEmpty()) return 0
    return PredictionTable
        .select(PredictionTable.points.sum())
        .where { (PredictionTable.matchId inList liveMatchIds) and (PredictionTable.memberId eq userId) }
        .firstOrNull()?.get(PredictionTable.points.sum()) ?: 0
}
