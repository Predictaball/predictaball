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
 * Every country represented in the game — i.e. supported by at least one
 * member — is included, even if none of its supporters have a scored
 * prediction yet (such countries score 0.0).
 *
 * A country's score for a single match is the average of the points scored by
 * that country's supporters who predicted that match — members who did not
 * predict are ignored. The country's overall score is the sum of those
 * per-match averages across every match that has been scored.
 */
fun calculateCountryRankings(): List<CountryLeaderboardInner> {
    data class ScoredPrediction(
        val teamId: Int,
        val matchId: Int,
        val memberId: String,
        val points: Int,
    )

    data class RepresentedCountry(
        val teamId: Int,
        val teamName: String,
        val flagCode: String,
    )

    val (representedCountries, scoredPredictions) = transaction {
        // Every country with at least one supporter is represented in the game.
        val countries = MemberTable
            .join(TeamTable, JoinType.INNER, MemberTable.supportedTeamId, TeamTable.id)
            .select(TeamTable.id, TeamTable.name, TeamTable.flagCode)
            .map {
                RepresentedCountry(
                    it[TeamTable.id],
                    it[TeamTable.name],
                    it[TeamTable.flagCode],
                )
            }
            .distinctBy { it.teamId }

        val predictions = (PredictionTable innerJoin MemberTable)
            .join(TeamTable, JoinType.INNER, MemberTable.supportedTeamId, TeamTable.id)
            .select(
                TeamTable.id,
                PredictionTable.matchId,
                PredictionTable.memberId,
                PredictionTable.points,
            )
            .where { PredictionTable.points.isNotNull() }
            .map {
                ScoredPrediction(
                    it[TeamTable.id],
                    it[PredictionTable.matchId],
                    it[PredictionTable.memberId],
                    it[PredictionTable.points]!!,
                )
            }

        countries to predictions
    }

    data class CountryAggregate(
        val teamId: Int,
        val teamName: String,
        val leagueId: String,
        val flagCode: String,
        val score: Double,
        val predictedMatches: Int,
        val predictorCount: Int,
    )

    val predictionsByTeam = scoredPredictions.groupBy { it.teamId }

    val aggregates = representedCountries
        .map { country ->
            val predictions = predictionsByTeam[country.teamId].orEmpty()
            val perMatch = predictions.groupBy { it.matchId }
            // Countries whose supporters haven't scored a prediction yet score 0.0.
            val score = perMatch.values.sumOf { matchPredictions ->
                matchPredictions.map { it.points }.average()
            }
            CountryAggregate(
                teamId = country.teamId,
                teamName = country.teamName.toTitleCase(),
                leagueId = country.teamName.toCountryLeagueId(),
                flagCode = country.flagCode,
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
            position = currentPosition,
            teamId = aggregate.teamId.toString(),
            teamName = aggregate.teamName,
            leagueId = aggregate.leagueId,
            flagCode = aggregate.flagCode,
            score = aggregate.score,
            predictedMatches = aggregate.predictedMatches,
            predictorCount = aggregate.predictorCount,
            movement = CountryLeaderboardInner.Movement.UNCHANGED,
        )
    }
}
