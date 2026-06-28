package scorcerer.server.schedule

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import org.http4k.client.JavaHttpClient
import org.http4k.core.Method
import org.http4k.core.Request
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.update
import org.openapitools.server.models.Match
import scorcerer.server.db.tables.MatchRound
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.TeamTable
import scorcerer.server.emitCount
import scorcerer.server.fromJson
import scorcerer.server.log
import scorcerer.server.services.TournamentStateService
import scorcerer.server.services.endMatch
import scorcerer.server.services.getMatchDay
import scorcerer.server.services.setScore
import scorcerer.utils.LeaderboardService
import java.text.Normalizer
import java.time.Duration
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

// ESPN's site scoreboard API. Undocumented but stable for years — powers their
// own site. One call returns every WC fixture in the date range, with status,
// scores, and bracket placeholder names ("Round of 32 1 Winner") for fixtures
// whose participants aren't yet known.
@JsonIgnoreProperties(ignoreUnknown = true)
private data class EspnTeam(val displayName: String?, val abbreviation: String?)

@JsonIgnoreProperties(ignoreUnknown = true)
private data class EspnCompetitor(val homeAway: String?, val score: String?, val team: EspnTeam?)

@JsonIgnoreProperties(ignoreUnknown = true)
private data class EspnStatusType(val state: String?, val name: String?, val completed: Boolean?)

@JsonIgnoreProperties(ignoreUnknown = true)
private data class EspnStatus(val type: EspnStatusType?)

@JsonIgnoreProperties(ignoreUnknown = true)
private data class EspnVenue(val fullName: String?)

@JsonIgnoreProperties(ignoreUnknown = true)
private data class EspnCompetition(
    val competitors: List<EspnCompetitor>?,
    val status: EspnStatus?,
    val venue: EspnVenue?,
)

@JsonIgnoreProperties(ignoreUnknown = true)
private data class EspnSeason(val slug: String?)

@JsonIgnoreProperties(ignoreUnknown = true)
private data class EspnEvent(
    val id: String,
    val date: String?,
    val season: EspnSeason?,
    val status: EspnStatus?,
    val competitions: List<EspnCompetition>?,
)

@JsonIgnoreProperties(ignoreUnknown = true)
private data class EspnScoreboardResponse(val events: List<EspnEvent>?)

// Snapshot of a row in our match table at the start of a tick.
private data class ExistingMatch(
    val matchId: Int,
    val homeTeamId: Int,
    val awayTeamId: Int,
    val datetime: OffsetDateTime,
    val state: Match.State,
    val espnId: String?,
    val venue: String,
)

// ESPN team names that don't match our team table verbatim. Same alias map we
// used for the TheSportsDB migration — names tend to vary on the same axes.
private val TEAM_ALIASES = mapOf(
    "usa" to "united states",
    "czechia" to "czech republic",
    "bosnia herzegovina" to "bosnia and herzegovina",
    "cape verde islands" to "cape verde",
    "cote d ivoire" to "ivory coast",
    "congo dr" to "dr congo",
    "turkiye" to "turkey",
)

// ESPN venue names that don't match the canonical name we use in our DB and
// the frontend's stadium-coords table. Keys are lowercased substrings to match
// against ESPN's fullName; values are what we store. Add new aliases here
// when ESPN reports a stadium under a sponsored/renamed banner.
private val VENUE_ALIASES = mapOf(
    // Estadio Azteca was renamed Estadio Banorte for the 2026 World Cup.
    "banorte" to "Estadio Azteca",
)

private fun canonicalVenue(fullName: String?): String? {
    if (fullName.isNullOrBlank()) return null
    val lower = fullName.lowercase()
    for ((alias, canonical) in VENUE_ALIASES) {
        if (lower.contains(alias)) return canonical
    }
    return fullName
}

// Strip diacritics + non-alphanumeric, lowercase, alias-map. Mirrors V11.
private fun normalizeTeamName(s: String?): String? {
    if (s.isNullOrBlank()) return null
    val noDia = Normalizer.normalize(s, Normalizer.Form.NFKD)
        .replace(Regex("\\p{InCombiningDiacriticalMarks}+"), "")
    val cleaned = noDia.lowercase()
        .replace(Regex("[^a-z0-9 ]+"), " ")
        .replace(Regex("\\s+"), " ")
        .trim()
    return TEAM_ALIASES[cleaned] ?: cleaned
}

// ESPN uses bracket placeholder strings as team names for fixtures whose
// participants aren't yet determined ("Group L Winner", "Round of 32 1 Winner",
// "Third Place Group A/E/H/I/J"). Detect and skip these — they're not real
// teams.
private fun isPlaceholderTeamName(name: String?): Boolean {
    if (name.isNullOrBlank()) return true
    val markers = listOf("Winner", "Place", "Group ", "Round of", "TBD")
    return markers.any { name.contains(it, ignoreCase = true) }
}

// ESPN's season slug for each tournament phase. We discover/store every
// confirmed fixture; whether each round is *exposed* to users is decided at
// the API layer (see listMatches in MatchResource).
private fun roundFromSlug(slug: String?): MatchRound? = when (slug) {
    "group-stage" -> MatchRound.GROUP_STAGE
    "round-of-32" -> MatchRound.ROUND_OF_THIRTY_TWO
    "round-of-16" -> MatchRound.ROUND_OF_SIXTEEN
    "quarterfinals" -> MatchRound.QUARTER_FINAL
    "semifinals" -> MatchRound.SEMI_FINAL
    "3rd-place-match" -> MatchRound.THIRD_PLACE_PLAYOFF
    "final" -> MatchRound.FINAL
    else -> null
}

class ScoreUpdater(
    private val leaderboardService: LeaderboardService,
    private val tournamentStateService: TournamentStateService,
) {
    private val client = JavaHttpClient()

    // One call returns the whole tournament window. We pass a 60-day range so
    // we get group + every knockout round in one request.
    private val scoreboardUrl = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260601-20260801"

    fun run() {
        val started = System.currentTimeMillis()
        val response = client(Request(Method.GET, scoreboardUrl))
        val httpMs = System.currentTimeMillis() - started

        if (!response.status.successful) {
            log.warn("ScoreUpdater: ESPN returned ${response.status.code} after ${httpMs}ms, skipping")
            return
        }

        val events = response.bodyString().fromJson<EspnScoreboardResponse>().events ?: emptyList()
        log.info("ScoreUpdater poll: http=${httpMs}ms events=${events.size}")

        var inserted = 0
        var transitions = 0
        var skippedPlaceholder = 0
        var unknownTeam = 0

        // Pre-load existing matches keyed by ESPN id, with the full row also
        // available for team-pair fallback matching. The fallback lets us
        // backfill espn_match_id on rows originally inserted with TheSportsDB
        // IDs, without creating duplicates.
        val existing: List<ExistingMatch> = transaction {
            MatchTable.selectAll().map {
                ExistingMatch(
                    matchId = it[MatchTable.id],
                    homeTeamId = it[MatchTable.homeTeamId],
                    awayTeamId = it[MatchTable.awayTeamId],
                    datetime = it[MatchTable.datetime],
                    state = it[MatchTable.state],
                    espnId = it[MatchTable.externalMatchId],
                    venue = it[MatchTable.venue],
                )
            }
        }
        val byEspnId = existing.filter { it.espnId != null }.associateBy { it.espnId!! }

        for (event in events) {
            val competition = event.competitions?.firstOrNull() ?: continue
            val competitors = competition.competitors ?: continue
            val homeC = competitors.firstOrNull { it.homeAway == "home" } ?: continue
            val awayC = competitors.firstOrNull { it.homeAway == "away" } ?: continue
            val homeName = homeC.team?.displayName
            val awayName = awayC.team?.displayName

            // Bracket placeholders — fixture exists but participants not known
            // yet. Skip until ESPN populates real team names.
            if (isPlaceholderTeamName(homeName) || isPlaceholderTeamName(awayName)) {
                skippedPlaceholder++
                continue
            }

            // Look up team IDs in our DB.
            val homeTeamId = findTeamId(normalizeTeamName(homeName))
            val awayTeamId = findTeamId(normalizeTeamName(awayName))
            if (homeTeamId == null || awayTeamId == null) {
                log.warn("ScoreUpdater: unknown team for event ${event.id}: home=$homeName(${homeTeamId ?: "MISSING"}) away=$awayName(${awayTeamId ?: "MISSING"})")
                emitCount("ScoreUpdater_UnknownTeam")
                unknownTeam++
                continue
            }

            val round = roundFromSlug(event.season?.slug)
            if (round == null) {
                // E.g. 3rd-place-match — deliberately not tracked. Don't log
                // each tick to avoid spam.
                continue
            }

            val kickoff = parseEspnDate(event.date) ?: run {
                log.warn("ScoreUpdater: unparseable date '${event.date}' for event ${event.id}")
                continue
            }
            val state = event.status?.type?.state ?: ""
            val homeScore = homeC.score?.toIntOrNull() ?: 0
            val awayScore = awayC.score?.toIntOrNull() ?: 0
            val venueName = canonicalVenue(competition.venue?.fullName)

            // Find an existing match for this fixture: first by espn id, then
            // by the team-pair + close-enough kickoff date.
            val match = byEspnId[event.id] ?: matchByTeamsAndDate(existing, homeTeamId, awayTeamId, kickoff)

            if (match == null) {
                // Genuinely new fixture (knockout discovery, or a brand-new
                // tournament). Insert as UPCOMING; subsequent ticks will move
                // it to LIVE/COMPLETED as the state changes.
                val newId = transaction {
                    MatchTable.insert {
                        it[MatchTable.homeTeamId] = homeTeamId
                        it[MatchTable.awayTeamId] = awayTeamId
                        it[MatchTable.datetime] = kickoff
                        it[MatchTable.state] = Match.State.UPCOMING
                        it[MatchTable.venue] = venueName ?: "TBD"
                        it[MatchTable.matchDay] = matchDayForKickoff(kickoff)
                        it[MatchTable.round] = round
                        it[MatchTable.externalMatchId] = event.id
                    } get MatchTable.id
                }
                log.info("ScoreUpdater: inserted match $newId espn=${event.id} round=$round $homeName vs $awayName kickoff=$kickoff")
                emitCount("ScoreUpdater_Inserted")
                inserted++
                continue
            }

            // Existing row found via team-pair fallback rather than by id —
            // that means the stored external id is stale (e.g. a TheSportsDB
            // id left from a previous integration). Overwrite with the ESPN id
            // so subsequent ticks can match by id directly.
            if (match.espnId != event.id) {
                transaction {
                    MatchTable.update({ MatchTable.id eq match.matchId }) {
                        it[MatchTable.externalMatchId] = event.id
                    }
                }
                log.info("Match ${match.matchId}: set external_match_id=${event.id} (was ${match.espnId})")
            }

            // Backfill venue for fixtures that were inserted before the venue
            // was known (knockouts go in as "TBD"). Only overwrite the TBD
            // placeholder — never touch a venue that was set explicitly.
            if (venueName != null && match.venue == "TBD") {
                transaction {
                    MatchTable.update({ MatchTable.id eq match.matchId }) {
                        it[MatchTable.venue] = venueName
                    }
                }
                log.info("Match ${match.matchId}: backfilled venue=$venueName")
            }

            // Side-swap detection: same fixture, but home/away flipped vs DB.
            if (match.homeTeamId != homeTeamId || match.awayTeamId != awayTeamId) {
                val sameSet = setOf(match.homeTeamId, match.awayTeamId) == setOf(homeTeamId, awayTeamId)
                if (sameSet) {
                    log.warn("ScoreUpdater: SIDE SWAP for match ${match.matchId} (espn=${event.id}) — db has teams ${match.homeTeamId}/${match.awayTeamId}, ESPN says $homeTeamId/$awayTeamId. Skipping score update.")
                    emitCount("ScoreUpdater_SideSwapDetected")
                    continue
                } else {
                    log.warn("ScoreUpdater: TEAM MISMATCH for match ${match.matchId} (espn=${event.id}) — db has teams ${match.homeTeamId}/${match.awayTeamId}, ESPN says $homeTeamId/$awayTeamId. Skipping score update.")
                    emitCount("ScoreUpdater_TeamMismatch")
                    continue
                }
            }

            // State transitions (same shape as before).
            when (state) {
                "post" -> {
                    if (match.state == Match.State.COMPLETED) continue
                    if (match.state == Match.State.UPCOMING) {
                        val matchDay = getMatchDay(match.matchId.toString()) ?: continue
                        setScore(match.matchId.toString(), matchDay, homeScore, awayScore, leaderboardService, tournamentStateService)
                    }
                    endMatch(match.matchId.toString(), homeScore, awayScore, leaderboardService, tournamentStateService)
                    log.info("Match ${match.matchId}: ${match.state} -> COMPLETED ($homeScore-$awayScore)")
                    transitions++
                }
                "in" -> {
                    val matchDay = getMatchDay(match.matchId.toString()) ?: continue
                    setScore(match.matchId.toString(), matchDay, homeScore, awayScore, leaderboardService, tournamentStateService)
                    log.info("Match ${match.matchId}: ${match.state} -> LIVE ($homeScore-$awayScore)")
                    transitions++
                }
                // "pre" / anything else: do nothing.
            }
        }
        log.info("ScoreUpdater done: events=${events.size} inserted=$inserted transitions=$transitions skippedPlaceholder=$skippedPlaceholder unknownTeam=$unknownTeam")
    }

    private fun findTeamId(normalizedName: String?): Int? {
        if (normalizedName == null) return null
        return transaction {
            TeamTable.selectAll().firstOrNull {
                normalizeTeamName(it[TeamTable.name]) == normalizedName
            }?.get(TeamTable.id)
        }
    }

    // ESPN date format: "2026-06-28T19:00Z" — note missing seconds. Java's ISO
    // parser handles this fine but we normalize defensively.
    private fun parseEspnDate(date: String?): OffsetDateTime? {
        if (date.isNullOrBlank()) return null
        return try {
            OffsetDateTime.parse(date, DateTimeFormatter.ISO_OFFSET_DATE_TIME)
        } catch (_: Exception) {
            null
        }
    }

    private fun matchByTeamsAndDate(
        existing: List<ExistingMatch>,
        homeTeamId: Int,
        awayTeamId: Int,
        kickoff: OffsetDateTime,
    ): ExistingMatch? {
        // Loose match: same team pair (regardless of side), kickoff within 6h.
        // Tolerates schedule tweaks but won't conflate different fixtures.
        val pair = setOf(homeTeamId, awayTeamId)
        return existing.firstOrNull {
            setOf(it.homeTeamId, it.awayTeamId) == pair &&
                Duration.between(it.datetime, kickoff).abs() < Duration.ofHours(6)
        }
    }

    // match_day numbers each session of fixtures in the tournament. The seed
    // assigns 1..17 to the group stage, with a session boundary that follows
    // the host country's local calendar (i.e. late-night UTC kickoffs share
    // the same match_day as the prior evening's games). Compute the same way
    // for knockout fixtures: number of days since the tournament started in
    // LA time, plus one. Used as the S3 leaderboard snapshot key and for
    // computing position movement against the previous day's snapshot.
    private fun matchDayForKickoff(kickoff: OffsetDateTime): Int {
        val localDate = kickoff.atZoneSameInstant(MATCH_DAY_ZONE).toLocalDate()
        return ChronoUnit.DAYS.between(TOURNAMENT_START_DATE, localDate).toInt() + 1
    }

    companion object {
        // Anchors for match_day derivation. The group-stage seed used these
        // same boundaries; we hardcode them so newly-discovered fixtures slot
        // into the same numbering scheme.
        private val TOURNAMENT_START_DATE: LocalDate = LocalDate.of(2026, 6, 11)
        private val MATCH_DAY_ZONE: ZoneId = ZoneId.of("America/Los_Angeles")
    }
}
