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

// TheSportsDB returns scores as strings ("2") and statuses as short codes
// (NS / 1H / HT / 2H / FT / etc). Unknown fields are ignored — they ship many.
@JsonIgnoreProperties(ignoreUnknown = true)
private data class SdbEvent(
    val idEvent: String,
    val strStatus: String?,
    val intHomeScore: String?,
    val intAwayScore: String?,
)

@JsonIgnoreProperties(ignoreUnknown = true)
private data class SdbResponse(val events: List<SdbEvent>?)

private val LIVE_STATUSES = setOf("1H", "HT", "2H", "ET", "PT", "INT", "BT")
private val FINISHED_STATUSES = setOf("FT", "AET", "AP", "PEN")

class ScoreUpdater(
    private val leaderboardService: LeaderboardService,
    private val tournamentStateService: TournamentStateService,
) {
    private val client = JavaHttpClient()

    // Public free key `3` — no auth header required, 30 req/min.
    private val perMatchEndpoint = "https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id="

    fun run() {
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
            val response = client(Request(Method.GET, perMatchEndpoint + externalId))
            val httpMs = System.currentTimeMillis() - started

            if (!response.status.successful) {
                log.warn("Match $matchId: TheSportsDB returned ${response.status.code} (http=${httpMs}ms)")
                return@forEach
            }

            val event = response.bodyString().fromJson<SdbResponse>().events?.firstOrNull()
            if (event == null) {
                log.warn("Match $matchId: TheSportsDB returned no event for id=$externalId")
                return@forEach
            }

            val status = event.strStatus ?: ""
            val home = event.intHomeScore?.toIntOrNull() ?: 0
            val away = event.intAwayScore?.toIntOrNull() ?: 0
            log.info("Match $matchId poll: http=${httpMs}ms api.status=$status api.score=$home-$away")

            when {
                status in FINISHED_STATUSES -> {
                    if (currentState == Match.State.UPCOMING) {
                        val matchDay = getMatchDay(matchId) ?: return@forEach
                        setScore(matchId, matchDay, home, away, leaderboardService, tournamentStateService)
                    }
                    endMatch(matchId, home, away, leaderboardService, tournamentStateService)
                    log.info("Match $matchId: $currentState -> COMPLETED ($home-$away)")
                    transitions++
                }
                status in LIVE_STATUSES -> {
                    val matchDay = getMatchDay(matchId) ?: return@forEach
                    setScore(matchId, matchDay, home, away, leaderboardService, tournamentStateService)
                    log.info("Match $matchId: $currentState -> LIVE ($home-$away, api=$status)")
                    transitions++
                }
                status.isNotBlank() && status != "NS" && status != "TBD" -> {
                    log.warn("Match $matchId: api status=$status, no-op")
                }
                // NS / TBD / "" — match hasn't started yet, do nothing.
            }
        }
        log.info("ScoreUpdater done: tracked=${matches.size} transitions=$transitions")
    }
}
