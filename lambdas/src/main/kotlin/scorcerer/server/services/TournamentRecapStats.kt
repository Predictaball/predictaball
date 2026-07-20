package scorcerer.server.services

import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.update
import org.openapitools.server.models.Chip
import scorcerer.server.db.tables.LeagueKind
import scorcerer.server.db.tables.LeagueMembershipTable
import scorcerer.server.db.tables.LeagueTable
import scorcerer.server.db.tables.MatchResult
import scorcerer.server.db.tables.MatchRound
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.db.tables.TeamTable
import java.time.OffsetDateTime

// Builds fully-populated RecapStats for the send batch. Everything that
// doesn't depend on the recipient is computed once in [computeShared] — the
// per-user step then does a handful of lightweight lookups against those
// precomputed maps rather than scanning full tables again.
object TournamentRecapStats {

    data class Shared(
        val totalPlayers: Int,
        val totalMatches: Int,
        val champion: TournamentRecapEmail.TournamentChampion,
        val podium: List<TournamentRecapEmail.PodiumEntry>,
        /** Predictions each member has submitted, keyed by member id. */
        val predictionCountByMember: Map<String, Int>,
        /**
         * Knockout league standings — member id → (points, rank). Only
         * includes members with at least 1 knockout point.
         */
        val knockoutRankByMember: Map<String, Pair<Int, Int>>,
        /** Total members in the knockout league (i.e. `knockoutRankByMember.size`). */
        val knockoutLeagueSize: Int,
        /** Country peers keyed by team id — used for country-rank lookups. */
        val membersByCountry: Map<Int, List<MemberSnapshot>>,
        /** All teams keyed by id, for cheap flag / name lookups. */
        val teamById: Map<Int, TeamSnapshot>,
        /** Global rank keyed by member id — computed once, same tie-break as the podium. */
        val globalRankByMember: Map<String, Int>,
    )

    data class MemberSnapshot(val id: String, val points: Int)
    data class TeamSnapshot(val name: String, val flagCode: String)

    fun computeShared(): Shared = transaction {
        val members = MemberTable.selectAll().toList()
        val totalPlayers = members.size
        val totalMatches = MatchTable.selectAll().count().toInt()

        val teamById = TeamTable.selectAll().associate {
            it[TeamTable.id] to TeamSnapshot(it[TeamTable.name], it[TeamTable.flagCode])
        }

        val champion = buildChampion(teamById)
        val podium = buildPodium(members, teamById)

        val predictionCountByMember = mutableMapOf<String, Int>()
        val knockoutPointsByMember = mutableMapOf<String, Int>()

        // Single pass across predictions ⨝ match — feeds both the per-member
        // prediction count and the knockout-points aggregate.
        (PredictionTable innerJoin MatchTable).selectAll().forEach { row ->
            val memberId = row[PredictionTable.memberId]
            predictionCountByMember[memberId] = (predictionCountByMember[memberId] ?: 0) + 1
            if (row[MatchTable.round] != MatchRound.GROUP_STAGE) {
                val pts = row[PredictionTable.points] ?: 0
                if (pts > 0) {
                    knockoutPointsByMember[memberId] = (knockoutPointsByMember[memberId] ?: 0) + pts
                }
            }
        }

        val knockoutSorted = knockoutPointsByMember.entries
            .sortedWith(compareByDescending<Map.Entry<String, Int>> { it.value }.thenBy { it.key })
        val knockoutRankByMember = knockoutSorted.mapIndexed { idx, e -> e.key to (e.value to (idx + 1)) }.toMap()

        val membersByCountry = members
            .mapNotNull { row ->
                val teamId = row[MemberTable.supportedTeamId] ?: return@mapNotNull null
                teamId to MemberSnapshot(row[MemberTable.id], row[MemberTable.fixedPoints])
            }
            .groupBy({ it.first }, { it.second })

        // Global rank once, applied per user via a map lookup. Tie-break
        // on member id ascending matches the podium's ordering.
        val globalSorted = members.sortedWith(
            compareByDescending<org.jetbrains.exposed.v1.core.ResultRow> { it[MemberTable.fixedPoints] }
                .thenBy { it[MemberTable.id] },
        )
        val globalRankByMember = globalSorted.mapIndexed { idx, row -> row[MemberTable.id] to (idx + 1) }.toMap()

        Shared(
            totalPlayers = totalPlayers,
            totalMatches = totalMatches,
            champion = champion,
            podium = podium,
            predictionCountByMember = predictionCountByMember,
            knockoutRankByMember = knockoutRankByMember,
            knockoutLeagueSize = knockoutSorted.size,
            membersByCountry = membersByCountry,
            teamById = teamById,
            globalRankByMember = globalRankByMember,
        )
    }

    private fun buildChampion(teamById: Map<Int, TeamSnapshot>): TournamentRecapEmail.TournamentChampion {
        val finalRow = MatchTable.selectAll()
            .where { MatchTable.round eq MatchRound.FINAL }
            .orderBy(MatchTable.datetime to SortOrder.DESC)
            .limit(1)
            .firstOrNull()
            ?: error("Cannot build tournament recap: no FINAL match row found")

        val homeTeamId = finalRow[MatchTable.homeTeamId]
        val awayTeamId = finalRow[MatchTable.awayTeamId]
        val homeScore = finalRow[MatchTable.homeScore] ?: 0
        val awayScore = finalRow[MatchTable.awayScore] ?: 0
        val homeWon = finalRow[MatchTable.result] == MatchResult.HOME ||
            (finalRow[MatchTable.result] == null && homeScore > awayScore)
        val (winnerId, loserId) = if (homeWon) homeTeamId to awayTeamId else awayTeamId to homeTeamId
        val winner = teamById.getValue(winnerId)
        val loser = teamById.getValue(loserId)
        return TournamentRecapEmail.TournamentChampion(
            teamName = winner.name,
            flagCode = winner.flagCode,
            runnerUpName = loser.name,
            runnerUpFlagCode = loser.flagCode,
            finalHomeScore = if (homeWon) homeScore else awayScore,
            finalAwayScore = if (homeWon) awayScore else homeScore,
        )
    }

    private fun buildPodium(
        members: List<org.jetbrains.exposed.v1.core.ResultRow>,
        teamById: Map<Int, TeamSnapshot>,
    ): List<TournamentRecapEmail.PodiumEntry> = members
        .sortedWith(compareByDescending<org.jetbrains.exposed.v1.core.ResultRow> { it[MemberTable.fixedPoints] }.thenBy { it[MemberTable.id] })
        .take(3)
        .map { row ->
            val team = row[MemberTable.supportedTeamId]?.let { teamById[it] }
            TournamentRecapEmail.PodiumEntry(
                firstName = row[MemberTable.firstName],
                familyName = row[MemberTable.familyName],
                countryName = team?.name ?: "",
                flagCode = team?.flagCode ?: "",
                points = row[MemberTable.fixedPoints],
                isMe = false,
            )
        }

    // Per-user stats. Uses only precomputed data from [shared] plus 2 point
    // queries (member row + best prediction + custom-league count).
    fun computeFor(memberId: String, shared: Shared): TournamentRecapEmail.RecapStats = transaction {
        val member = MemberTable.selectAll().where { MemberTable.id eq memberId }.first()
        val myPoints = member[MemberTable.fixedPoints]
        val globalRank = shared.globalRankByMember[memberId] ?: shared.totalPlayers
        val predictionsMade = shared.predictionCountByMember[memberId] ?: 0

        val bestRow = (PredictionTable innerJoin MatchTable)
            .selectAll()
            .where { PredictionTable.memberId eq memberId }
            .orderBy(PredictionTable.points to SortOrder.DESC, MatchTable.datetime to SortOrder.ASC)
            .limit(1)
            .firstOrNull()
        val bestPrediction = bestRow?.let { row ->
            val home = shared.teamById.getValue(row[MatchTable.homeTeamId])
            val away = shared.teamById.getValue(row[MatchTable.awayTeamId])
            TournamentRecapEmail.BestPrediction(
                points = row[PredictionTable.points] ?: 0,
                homeName = home.name,
                homeFlagCode = home.flagCode,
                awayName = away.name,
                awayFlagCode = away.flagCode,
                actualHome = row[MatchTable.homeScore] ?: 0,
                actualAway = row[MatchTable.awayScore] ?: 0,
                roundLabel = roundLabel(row[MatchTable.round]),
                chipLabel = chipLabel(row[PredictionTable.chip]),
            )
        }

        val customLeagues = (LeagueMembershipTable innerJoin LeagueTable)
            .selectAll()
            .where { (LeagueMembershipTable.memberId eq memberId) and (LeagueTable.kind eq LeagueKind.USER) }
            .count()
            .toInt()

        // Country rank: only shown when the user has picked a country and
        // there are at least 3 peers to compare against.
        val countryRank = member[MemberTable.supportedTeamId]?.let { teamId ->
            val peers = shared.membersByCountry[teamId] ?: emptyList()
            if (peers.size < 3) {
                null
            } else {
                val team = shared.teamById.getValue(teamId)
                val sorted = peers.sortedWith(compareByDescending<MemberSnapshot> { it.points }.thenBy { it.id })
                val myRank = sorted.indexOfFirst { it.id == memberId } + 1
                TournamentRecapEmail.CountryRank(
                    countryName = team.name,
                    flagCode = team.flagCode,
                    rank = myRank,
                    total = peers.size,
                )
            }
        }

        val knockoutRank = shared.knockoutRankByMember[memberId]?.let { (points, rank) ->
            TournamentRecapEmail.KnockoutRank(
                points = points,
                rank = rank,
                total = shared.knockoutLeagueSize,
            )
        }

        // Mark the recipient's own row on the podium if they're on it.
        val podium = shared.podium.map { entry ->
            entry.copy(
                isMe = entry.firstName == member[MemberTable.firstName] &&
                    entry.familyName == member[MemberTable.familyName],
            )
        }

        TournamentRecapEmail.RecapStats(
            firstName = member[MemberTable.firstName],
            finalPoints = myPoints,
            finalRank = globalRank,
            totalPlayers = shared.totalPlayers,
            predictionsMade = predictionsMade,
            totalMatches = shared.totalMatches,
            bestPrediction = bestPrediction,
            customLeaguesCount = customLeagues,
            countryRank = countryRank,
            knockoutRank = knockoutRank,
            champion = shared.champion,
            podium = podium,
        )
    }

    // Members eligible for the recap: at least [threshold] predictions and
    // haven't been sent yet. Stable ordering keeps batch runs predictable.
    fun eligibleRecipients(shared: Shared, threshold: Int): List<EligibleMember> = transaction {
        MemberTable.selectAll()
            .where { MemberTable.recapSentAt.isNull() }
            .filter { (shared.predictionCountByMember[it[MemberTable.id]] ?: 0) >= threshold }
            .map { EligibleMember(id = it[MemberTable.id], email = it[MemberTable.email]) }
            .sortedBy { it.id }
    }

    data class EligibleMember(val id: String, val email: String)

    private fun roundLabel(round: MatchRound): String = when (round) {
        MatchRound.GROUP_STAGE -> "Group Stage"
        MatchRound.ROUND_OF_THIRTY_TWO -> "Round of 32"
        MatchRound.ROUND_OF_SIXTEEN -> "Round of 16"
        MatchRound.QUARTER_FINAL -> "Quarter-Final"
        MatchRound.SEMI_FINAL -> "Semi-Final"
        MatchRound.THIRD_PLACE_PLAYOFF -> "Third-Place Playoff"
        MatchRound.FINAL -> "Final"
    }

    private fun chipLabel(chip: Chip): String? = when (chip) {
        Chip.NONE -> null
        Chip.DOUBLE_POINTS -> "2× Double Points"
        Chip.ONE_GOAL_OUT -> "±1 Off by One"
        Chip.CROWD -> "% Follow the Crowd"
    }
}

// Records that the recap was sent to a member. Called immediately after a
// successful Resend delivery so a partial batch failure doesn't re-send to
// users who already received the email.
fun markRecapSent(memberId: String) {
    val now = OffsetDateTime.now()
    transaction {
        MemberTable.update({ MemberTable.id eq memberId }) {
            it[MemberTable.recapSentAt] = now
        }
    }
}
