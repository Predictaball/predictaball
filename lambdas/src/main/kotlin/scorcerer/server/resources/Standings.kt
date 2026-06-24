package scorcerer.server.resources

import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.routes
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNotNull
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.GroupStanding
import org.openapitools.server.models.GroupStandingRow
import org.openapitools.server.models.Standings
import scorcerer.server.db.tables.MatchRound
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.TeamTable
import scorcerer.server.toJson
import scorcerer.utils.toTitleCase

/** A team that has been assigned to a group. */
internal data class StandingsTeam(
    val teamId: Int,
    val teamName: String,
    val flagCode: String,
    val group: String,
    val ranking: Int?,
)

/** A group-stage match with a (current) score — either live or completed. */
internal data class PlayedMatch(
    val homeTeamId: Int,
    val awayTeamId: Int,
    val homeScore: Int,
    val awayScore: Int,
)

/** Mutable accumulator for a single team's group-stage record. */
private class Accumulator(val team: StandingsTeam) {
    var played = 0
    var won = 0
    var drawn = 0
    var lost = 0
    var goalsFor = 0
    var goalsAgainst = 0
    val points get() = won * 3 + drawn
    val goalDifference get() = goalsFor - goalsAgainst
}

/** Head-to-head record of one team against a specific set of tied teams. */
private data class HeadToHead(val points: Int, val goalDifference: Int, val goalsFor: Int)

fun standingsRoutes() = routes(
    "/standings" bind Method.GET to {
        val (teams, matches) = transaction {
            val teams = TeamTable.selectAll()
                .where { TeamTable.group.isNotNull() }
                .map {
                    StandingsTeam(
                        it[TeamTable.id],
                        it[TeamTable.name].toTitleCase(),
                        it[TeamTable.flagCode],
                        it[TeamTable.group]!!,
                        it[TeamTable.ranking],
                    )
                }
            val teamIds = teams.map { it.teamId }.toSet()
            val matches = MatchTable.selectAll()
                .where {
                    (MatchTable.round eq MatchRound.GROUP_STAGE) and
                        MatchTable.homeScore.isNotNull() and
                        MatchTable.awayScore.isNotNull()
                }
                .map { PlayedMatch(it[MatchTable.homeTeamId], it[MatchTable.awayTeamId], it[MatchTable.homeScore]!!, it[MatchTable.awayScore]!!) }
                .filter { it.homeTeamId in teamIds && it.awayTeamId in teamIds }
            teams to matches
        }
        Response(Status.OK).body(computeStandings(teams, matches).toJson())
    },
)

/**
 * Build group-stage standings from the teams and the matches played (or in
 * progress) so far. Tie-breakers, in order:
 *   1. Most points in head-to-head matches among the tied teams
 *   2. Superior goal difference in those head-to-head matches
 *   3. Most goals scored in those head-to-head matches
 *   4. Superior goal difference across all group matches
 *   5. Most goals scored across all group matches
 *   6. Highest FIFA ranking (lowest ranking number)
 * (The conduct-score criterion is omitted as we don't track cards.)
 */
internal fun computeStandings(teams: List<StandingsTeam>, matches: List<PlayedMatch>): Standings {
    val accumulators = teams.associate { it.teamId to Accumulator(it) }

    matches.forEach { match ->
        val home = accumulators[match.homeTeamId] ?: return@forEach
        val away = accumulators[match.awayTeamId] ?: return@forEach
        home.played++
        away.played++
        home.goalsFor += match.homeScore
        home.goalsAgainst += match.awayScore
        away.goalsFor += match.awayScore
        away.goalsAgainst += match.homeScore
        when {
            match.homeScore > match.awayScore -> {
                home.won++
                away.lost++
            }
            match.homeScore < match.awayScore -> {
                away.won++
                home.lost++
            }
            else -> {
                home.drawn++
                away.drawn++
            }
        }
    }

    val groups = accumulators.values
        .groupBy { it.team.group }
        .toSortedMap()
        .map { (group, groupAccumulators) ->
            val ranked = rankGroup(groupAccumulators, matches)
            GroupStanding(group, ranked.mapIndexed { index, acc -> acc.toRow(index + 1) })
        }

    // Third-placed teams from every group, ranked against each other. Different
    // groups have no head-to-head, so only the overall criteria apply.
    val thirdPlaced = groups
        .mapNotNull { it.standings.getOrNull(2) }
        .sortedWith(
            compareByDescending<GroupStandingRow> { it.points }
                .thenByDescending { it.goalDifference }
                .thenByDescending { it.goalsFor }
                .thenBy { teams.first { t -> t.teamId.toString() == it.teamId }.ranking ?: Int.MAX_VALUE },
        )
        .mapIndexed { index, row -> row.copy(position = index + 1) }

    return Standings(groups, thirdPlaced)
}

private fun rankGroup(accumulators: List<Accumulator>, matches: List<PlayedMatch>): List<Accumulator> =
    accumulators
        .sortedByDescending { it.points }
        .groupBy { it.points }
        .flatMap { (_, cluster) -> rankCluster(cluster, matches) }

/** Order teams that are level on points using the head-to-head and overall tie-breakers. */
private fun rankCluster(cluster: List<Accumulator>, matches: List<PlayedMatch>): List<Accumulator> {
    if (cluster.size == 1) return cluster
    val tiedIds = cluster.map { it.team.teamId }.toSet()
    val headToHead = cluster.associate { it.team.teamId to headToHead(it.team.teamId, tiedIds, matches) }
    return cluster.sortedWith(
        compareByDescending<Accumulator> { headToHead.getValue(it.team.teamId).points }
            .thenByDescending { headToHead.getValue(it.team.teamId).goalDifference }
            .thenByDescending { headToHead.getValue(it.team.teamId).goalsFor }
            .thenByDescending { it.goalDifference }
            .thenByDescending { it.goalsFor }
            .thenBy { it.team.ranking ?: Int.MAX_VALUE },
    )
}

private fun headToHead(teamId: Int, tiedIds: Set<Int>, matches: List<PlayedMatch>): HeadToHead {
    var points = 0
    var goalsFor = 0
    var goalsAgainst = 0
    matches
        .filter { it.homeTeamId in tiedIds && it.awayTeamId in tiedIds && (it.homeTeamId == teamId || it.awayTeamId == teamId) }
        .forEach { match ->
            val (scored, conceded) = if (match.homeTeamId == teamId) {
                match.homeScore to match.awayScore
            } else {
                match.awayScore to match.homeScore
            }
            goalsFor += scored
            goalsAgainst += conceded
            points += when {
                scored > conceded -> 3
                scored == conceded -> 1
                else -> 0
            }
        }
    return HeadToHead(points, goalsFor - goalsAgainst, goalsFor)
}

private fun Accumulator.toRow(position: Int) = GroupStandingRow(
    position = position,
    teamId = team.teamId.toString(),
    teamName = team.teamName,
    flagCode = team.flagCode,
    group = team.group,
    played = played,
    won = won,
    drawn = drawn,
    lost = lost,
    goalsFor = goalsFor,
    goalsAgainst = goalsAgainst,
    goalDifference = goalDifference,
    points = points,
)
