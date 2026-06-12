package scorcerer.utils

import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.isNotNull
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.CountryLeaderboardInner
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.db.tables.TeamTable

/**
 * Rank every country (supported team) against one another.
 *
 * A country's score for a single match is the average of the points scored by
 * that country's supporters who predicted that match — members who did not
 * predict are ignored. The country's overall score is the sum of those
 * per-match averages across every match that has been scored.
 */
fun calculateCountryRankings(): List<CountryLeaderboardInner> {
    data class ScoredPrediction(
        val teamId: Int,
        val teamName: String,
        val flagCode: String,
        val matchId: Int,
        val memberId: String,
        val points: Int,
    )

    val scoredPredictions = transaction {
        (PredictionTable innerJoin MemberTable)
            .join(TeamTable, JoinType.INNER, MemberTable.supportedTeamId, TeamTable.id)
            .select(
                TeamTable.id,
                TeamTable.name,
                TeamTable.flagCode,
                PredictionTable.matchId,
                PredictionTable.memberId,
                PredictionTable.points,
            )
            .where { PredictionTable.points.isNotNull() }
            .map {
                ScoredPrediction(
                    it[TeamTable.id],
                    it[TeamTable.name],
                    it[TeamTable.flagCode],
                    it[PredictionTable.matchId],
                    it[PredictionTable.memberId],
                    it[PredictionTable.points]!!,
                )
            }
    }

    data class CountryAggregate(
        val teamId: Int,
        val teamName: String,
        val flagCode: String,
        val score: Double,
        val predictedMatches: Int,
        val predictorCount: Int,
    )

    val aggregates = scoredPredictions
        .groupBy { it.teamId }
        .map { (_, predictions) ->
            val perMatch = predictions.groupBy { it.matchId }
            val score = perMatch.values.sumOf { matchPredictions ->
                matchPredictions.map { it.points }.average()
            }
            CountryAggregate(
                teamId = predictions.first().teamId,
                teamName = predictions.first().teamName.toTitleCase(),
                flagCode = predictions.first().flagCode,
                score = score,
                predictedMatches = perMatch.size,
                predictorCount = predictions.map { it.memberId }.distinct().size,
            )
        }

    val sorted = aggregates.sortedWith(
        compareByDescending<CountryAggregate> { it.score }.thenBy { it.teamName },
    )

    var currentPosition = 0
    var previousScore = Double.MAX_VALUE
    return sorted.mapIndexed { index, aggregate ->
        // Standard competition ranking: equal scores share a position.
        if (aggregate.score < previousScore) {
            currentPosition = index + 1
        }
        previousScore = aggregate.score
        CountryLeaderboardInner(
            currentPosition,
            aggregate.teamId.toString(),
            aggregate.teamName,
            aggregate.flagCode,
            aggregate.score,
            aggregate.predictedMatches,
            aggregate.predictorCount,
            CountryLeaderboardInner.Movement.UNCHANGED,
        )
    }
}
