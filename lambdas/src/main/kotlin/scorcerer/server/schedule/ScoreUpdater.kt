package scorcerer.server.schedule

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import org.http4k.client.JavaHttpClient
import org.http4k.core.Method
import org.http4k.core.Request
import org.jetbrains.exposed.v1.core.notInList
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

// football-data.org returns null scores for matches that haven't kicked off
// and a string status that we collapse into LIVE / FINISHED / OTHER below.
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

@JsonIgnoreProperties(ignoreUnknown = true)
private data class FdMatchesResponse(val matches: List<FdMatch>)

private val LIVE_STATUSES = setOf("IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT")

class ScoreUpdater(
    private val leaderboardService: LeaderboardService,
    private val tournamentStateService: TournamentStateService,
) {
    private val client = JavaHttpClient()
    private val apiKey = System.getenv("FOOTBALL_DATA_API_KEY")

    // Pull every match in any state we care about — it's a single request and
    // the response is small. Filtering by date would save a few KB but adds a
    // round-trip when matches roll over UTC midnight.
    private val endpoint = "https://api.football-data.org/v4/competitions/2000/matches"

    fun run() {
        if (apiKey.isNullOrBlank()) {
            log.warn("FOOTBALL_DATA_API_KEY not set, skipping score update")
            return
        }

        val started = System.currentTimeMillis()
        val response = client(Request(Method.GET, endpoint).header("X-Auth-Token", apiKey))
        val httpMs = System.currentTimeMillis() - started
        // Lets us spot throttling before we hit the limit. football-data returns
        // these on every successful response.
        val available = response.header("X-Requests-Available-Minute")
        val resetIn = response.header("X-RequestCounter-Reset")

        if (!response.status.successful) {
            log.warn("football-data.org returned ${response.status.code} after ${httpMs}ms (available=$available, resetIn=${resetIn}s), skipping")
            return
        }

        val parsed = response.bodyString().fromJson<FdMatchesResponse>()
        val byExternalId = parsed.matches.associateBy { it.id.toString() }
        val statusBreakdown = parsed.matches.groupingBy { it.status }.eachCount()
        log.info("ScoreUpdater poll: http=${httpMs}ms apiMatches=${parsed.matches.size} statuses=$statusBreakdown available=$available")

        // Look up our matches that are still in play or scheduled — completed
        // ones don't need to be touched again.
        val ourMatches = transaction {
            MatchTable.selectAll()
                .where { MatchTable.state notInList listOf(Match.State.COMPLETED) }
                .filter { it.getOrNull(MatchTable.externalMatchId) != null }
                .map { Triple(it[MatchTable.id].toString(), it[MatchTable.externalMatchId]!!, it[MatchTable.state]) }
        }

        var transitions = 0
        ourMatches.forEach { (matchId, externalId, currentState) ->
            val api = byExternalId[externalId]
            if (api == null) {
                log.warn("Match $matchId: external $externalId not in API response, skipping")
                return@forEach
            }
            // Treat any null scores as 0-0 — happens between kickoff and first goal.
            val home = api.score.fullTime.home ?: 0
            val away = api.score.fullTime.away ?: 0

            when {
                api.status == "FINISHED" -> {
                    if (currentState == Match.State.UPCOMING) {
                        // Missed the live window entirely (e.g. server was down).
                        // Flip to LIVE first so endMatch's invariant holds.
                        val matchDay = getMatchDay(matchId) ?: return@forEach
                        setScore(matchId, matchDay, home, away, leaderboardService, tournamentStateService)
                    }
                    endMatch(matchId, home, away, leaderboardService, tournamentStateService)
                    log.info("Match $matchId: $currentState -> COMPLETED ($home-$away, api=${api.status})")
                    transitions++
                }
                api.status in LIVE_STATUSES -> {
                    val matchDay = getMatchDay(matchId) ?: return@forEach
                    setScore(matchId, matchDay, home, away, leaderboardService, tournamentStateService)
                    log.info("Match $matchId: $currentState -> LIVE ($home-$away, api=${api.status})")
                    transitions++
                }
                // SCHEDULED/TIMED/POSTPONED/SUSPENDED/CANCELLED/AWARDED: do nothing.
                api.status !in setOf("SCHEDULED", "TIMED") -> {
                    // Surface anomalies (POSTPONED, SUSPENDED, CANCELLED, AWARDED) so we
                    // notice quickly if a match needs manual handling.
                    log.warn("Match $matchId: api status=${api.status}, no-op")
                }
            }
        }
        log.info("ScoreUpdater done: ourTrackedMatches=${ourMatches.size} transitions=$transitions")
    }
}
