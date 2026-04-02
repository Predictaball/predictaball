package scorcerer.server.schedule

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import org.http4k.client.JavaHttpClient
import org.http4k.core.Method
import org.http4k.core.Request
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.Match
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.fromJson
import scorcerer.server.log
import scorcerer.server.resources.endMatch
import scorcerer.server.resources.getMatchDay
import scorcerer.server.resources.setScore
import scorcerer.utils.LeaderboardS3Service

@JsonIgnoreProperties(ignoreUnknown = true)
data class Team(
    val name: String,
    val score: Int,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class FotMobResponse(
    val header: FotMobHeader,
    val general: FotMobGeneral,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class FotMobHeader(
    val teams: List<Team>,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class FotMobGeneral(
    val started: Boolean,
    val finished: Boolean,
    val matchName: String,
)

data class LiveMatch(
    val matchId: String,
    val externalMatchId: String,
)

class ScoreUpdater(private val leaderboardService: LeaderboardS3Service) {
    private val client = JavaHttpClient()
    private val endpoint = "https://www.fotmob.com/api/matchDetails?matchId="

    fun run() {
        val liveMatches = transaction {
            MatchTable.selectAll()
                .where { MatchTable.state eq Match.State.LIVE }
                .filter { it.getOrNull(MatchTable.externalMatchId) != null }
                .map { LiveMatch(it[MatchTable.id].toString(), it[MatchTable.externalMatchId]!!) }
        }

        if (liveMatches.isEmpty()) {
            log.info("No live matches")
            return
        }

        liveMatches.forEach {
            log.info("Fetching for $it")
            val response = client(Request(Method.GET, endpoint + it.externalMatchId))

            log.info("Response status - ${response.status}")

            if (!response.status.successful) {
                log.info("Response status not good, skipping")
                return@forEach
            }

            val fotmobResponse = response.body.toString().fromJson<FotMobResponse>()
            log.info(fotmobResponse.general.matchName)

            if (!fotmobResponse.general.started) {
                log.info("Match has not started yet")
                return@forEach
            }

            val homeScore = fotmobResponse.header.teams.first().score
            val awayScore = fotmobResponse.header.teams.last().score
            log.info("Home score ($homeScore) Away score ($awayScore) for matchId (${it.matchId})")

            if (fotmobResponse.general.finished) {
                endMatch(it.matchId, homeScore, awayScore, leaderboardService)
                log.info("Match ended")
            } else {
                val matchDay = getMatchDay(it.matchId) ?: return@forEach
                setScore(it.matchId, matchDay, homeScore, awayScore, leaderboardService)
                log.info("Score updated")
            }
        }
    }
}
