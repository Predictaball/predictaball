package scorcerer.server.schedule

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import org.http4k.client.JavaHttpClient
import org.http4k.core.Method
import org.http4k.core.Request
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.Match
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.fromJson
import scorcerer.server.log
import scorcerer.server.services.TournamentStateService
import scorcerer.server.services.endMatch
import scorcerer.server.services.getMatchDay
import scorcerer.server.services.setScore
import scorcerer.utils.LeaderboardService
import java.time.OffsetDateTime
import java.time.ZoneOffset

// football-data's per-match endpoint. The competition-wide endpoint is served
// from a stale cache (lastUpdated stays hours behind kickoff), so we hit each
// tracked match individually for fresh data. Costs 1 request per live match
// per minute — well within the 10/min free-tier budget for ~3 concurrent games.
@JsonIgnoreProperties(ignoreUnknown = true)
private data class FdScore(val home: Int?, val away: Int?)

@JsonIgnoreProperties(ignoreUnknown = true)
private data class FdScoreBlock(val fullTime: FdScore)

@JsonIgnoreProperties(ignoreUnknown = true)
private data class FdMatch(
    val id: Int,
    val status: String,
    val score: FdScoreBlock,
)

private val LIVE_STATUSES = setOf("IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT")

class ScoreUpdater(
    private val leaderboardService: LeaderboardService,
    private val tournamentStateService: TournamentStateService,
) {
    private val client = JavaHttpClient()
    private val apiKey = System.getenv("FOOTBALL_DATA_API_KEY")
    private val perMatchEndpoint = "https://api.football-data.org/v4/matches/"

    fun run() {
        if (apiKey.isNullOrBlank()) {
            log.warn("FOOTBALL_DATA_API_KEY not set, skipping score update")
            return
        }

        // Only poll matches we're actively tracking — anything currently LIVE,
        // or UPCOMING within 4h of kickoff (covers the kickoff-detection window).
        val now = OffsetDateTime.now(ZoneOffset.UTC)
        val imminentCutoff = now.plusHours(4)
        val matches = transaction {
            MatchTable.selectAll()
                .where {
                    (MatchTable.state eq Match.State.LIVE) or
                        (
                            (MatchTable.state eq Match.State.UPCOMING) and
                                (MatchTable.datetime greaterEq now.minusHours(1)) and
                                (MatchTable.datetime less imminentCutoff)
                            )
                }
                .filter { it.getOrNull(MatchTable.externalMatchId) != null }
                .map { Triple(it[MatchTable.id].toString(), it[MatchTable.externalMatchId]!!, it[MatchTable.state]) }
        }

        if (matches.isEmpty()) {
            log.info("ScoreUpdater: no live or imminent matches, skipping")
            return
        }

        var transitions = 0
        matches.forEach { (matchId, externalId, currentState) ->
            val started = System.currentTimeMillis()
            val response = client(Request(Method.GET, perMatchEndpoint + externalId).header("X-Auth-Token", apiKey))
            val httpMs = System.currentTimeMillis() - started
            val available = response.header("X-Requests-Available-Minute")

            if (!response.status.successful) {
                log.warn("Match $matchId: football-data returned ${response.status.code} (http=${httpMs}ms, available=$available)")
                return@forEach
            }

            val api = response.bodyString().fromJson<FdMatch>()
            val home = api.score.fullTime.home ?: 0
            val away = api.score.fullTime.away ?: 0
            log.info("Match $matchId poll: http=${httpMs}ms api.status=${api.status} api.score=$home-$away available=$available")

            when {
                api.status == "FINISHED" -> {
                    if (currentState == Match.State.UPCOMING) {
                        val matchDay = getMatchDay(matchId) ?: return@forEach
                        setScore(matchId, matchDay, home, away, leaderboardService, tournamentStateService)
                    }
                    endMatch(matchId, home, away, leaderboardService, tournamentStateService)
                    log.info("Match $matchId: $currentState -> COMPLETED ($home-$away)")
                    transitions++
                }
                api.status in LIVE_STATUSES -> {
                    val matchDay = getMatchDay(matchId) ?: return@forEach
                    setScore(matchId, matchDay, home, away, leaderboardService, tournamentStateService)
                    log.info("Match $matchId: $currentState -> LIVE ($home-$away, api=${api.status})")
                    transitions++
                }
                api.status !in setOf("SCHEDULED", "TIMED") -> {
                    log.warn("Match $matchId: api status=${api.status}, no-op")
                }
            }
        }
        log.info("ScoreUpdater done: tracked=${matches.size} transitions=$transitions")
    }
}
