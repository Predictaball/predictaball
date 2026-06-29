package scorcerer.utils

import aws.sdk.kotlin.services.s3.S3Client
import aws.sdk.kotlin.services.s3.model.GetObjectRequest
import aws.sdk.kotlin.services.s3.model.ListObjectsV2Request
import aws.sdk.kotlin.services.s3.model.PutObjectRequest
import aws.smithy.kotlin.runtime.content.ByteStream
import aws.smithy.kotlin.runtime.content.decodeToString
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.CountryLeaderboardInner
import org.openapitools.server.models.LeaderboardInner
import org.openapitools.server.models.User
import scorcerer.server.db.tables.LeagueMembershipTable
import scorcerer.server.db.tables.MatchRound
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.TeamTable
import scorcerer.server.fromJson
import scorcerer.server.log
import scorcerer.server.toJson

enum class LeaderboardStage { ALL, GROUP_STAGE, KNOCKOUT }

private val knockoutRounds = MatchRound.entries.filterNot { it == MatchRound.GROUP_STAGE }

// Unlike calculateGlobalLeaderboard, this isn't cached per match day: it's a cheap
// on-the-fly aggregation, and stage-filtered views don't need movement tracking.
fun calculateStageLeaderboard(leagueId: String, stage: LeaderboardStage): List<LeaderboardInner> {
    require(stage != LeaderboardStage.ALL) { "ALL stage does not use calculateStageLeaderboard" }
    val rounds = if (stage == LeaderboardStage.GROUP_STAGE) listOf(MatchRound.GROUP_STAGE) else knockoutRounds

    val users = transaction {
        val pointsByUser = pointsByUserForRounds(rounds)
        (LeagueMembershipTable innerJoin MemberTable)
            .join(TeamTable, JoinType.LEFT, MemberTable.supportedTeamId, TeamTable.id)
            .select(
                MemberTable.id,
                MemberTable.firstName,
                MemberTable.familyName,
                MemberTable.doublePointsChips,
                MemberTable.oneOutChips,
                MemberTable.crowdChips,
                TeamTable.name,
                TeamTable.flagCode,
            )
            .where { LeagueMembershipTable.leagueId eq leagueId }
            .map { row ->
                User(
                    row[MemberTable.firstName],
                    row[MemberTable.familyName],
                    row[MemberTable.id],
                    row[MemberTable.doublePointsChips],
                    row[MemberTable.oneOutChips],
                    row[MemberTable.crowdChips],
                    0,
                    pointsByUser[row[MemberTable.id]] ?: 0,
                    row.getOrNull(TeamTable.name)?.toTitleCase(),
                    row.getOrNull(TeamTable.flagCode),
                )
            }
    }

    val sortedUsers = users.sortedByDescending { it.livePoints }
    var currentPosition = 0
    var previousPoints = Int.MAX_VALUE
    return sortedUsers.mapIndexed { index, user ->
        if (user.livePoints < previousPoints) currentPosition = index + 1
        previousPoints = user.livePoints
        LeaderboardInner(currentPosition, user, LeaderboardInner.Movement.UNCHANGED)
    }
}

fun filterLeaderboardToLeague(
    globalLeaderboard: List<LeaderboardInner>?,
    leagueUserIds: List<String>,
): List<LeaderboardInner> {
    val leagueUsers = (globalLeaderboard ?: emptyList()).filter { it.user.userId in leagueUserIds }

    val sortedLeague = leagueUsers.sortedWith(compareBy { it.position })
    var currentPosition = 1
    val lastFixedPoints = sortedLeague.firstOrNull()?.user?.fixedPoints ?: 0
    val lastLivePoints = sortedLeague.firstOrNull()?.user?.livePoints ?: 0
    var lastPoints = lastLivePoints + lastFixedPoints

    val filteredLeaderboard = sortedLeague.mapIndexed { index, leaderboardInner ->
        if (index > 0 && leaderboardInner.user.fixedPoints + leaderboardInner.user.livePoints < lastPoints) {
            currentPosition = index + 1
        }
        lastPoints = leaderboardInner.user.livePoints + leaderboardInner.user.fixedPoints
        LeaderboardInner(currentPosition, leaderboardInner.user, leaderboardInner.movement)
    }

    return filteredLeaderboard
}

fun calculateMovement(
    leaderboard: List<LeaderboardInner>,
    previousLeaderboard: List<LeaderboardInner>,
): List<LeaderboardInner> {
    val previousPositions = previousLeaderboard.associateBy { it.user.userId }
    return leaderboard.map { current ->
        val previous = previousPositions[current.user.userId]
        val movement = if (previous != null) {
            when {
                current.position < previous.position -> LeaderboardInner.Movement.IMPROVED
                current.position > previous.position -> LeaderboardInner.Movement.WORSENED
                else -> LeaderboardInner.Movement.UNCHANGED
            }
        } else {
            LeaderboardInner.Movement.UNCHANGED
        }
        current.copy(movement = movement)
    }
}

fun calculateGlobalLeaderboard(previousGlobalLeaderboard: List<LeaderboardInner>?): List<LeaderboardInner> {
    val globalUsers = transaction {
        val livePoints = livePointsByUser()

        (LeagueMembershipTable innerJoin MemberTable)
            .join(TeamTable, JoinType.LEFT, MemberTable.supportedTeamId, TeamTable.id)
            .select(
                MemberTable.id,
                MemberTable.firstName,
                MemberTable.familyName,
                MemberTable.fixedPoints,
                MemberTable.doublePointsChips,
                MemberTable.oneOutChips,
                MemberTable.crowdChips,
                TeamTable.name,
                TeamTable.flagCode,
            )
            .where { LeagueMembershipTable.leagueId eq "global" }
            .map { it.toUser(livePoints[it[MemberTable.id]] ?: 0) }
    }

    val sortedGlobalUsers =
        globalUsers.sortedWith(
            compareByDescending { it.livePoints + it.fixedPoints },
        )
    var currentPosition = 0
    var previousPoints = Int.MAX_VALUE
    val previousPositions = previousGlobalLeaderboard?.associateBy { it.user.userId } ?: emptyMap()

    val leaderboard = sortedGlobalUsers.mapIndexed { index, user ->
        if (user.livePoints + user.fixedPoints < previousPoints) {
            currentPosition = index + 1
        }
        previousPoints = user.livePoints + user.fixedPoints

        val previousPosition = previousPositions[user.userId]?.position ?: currentPosition
        val movement = when {
            currentPosition > previousPosition -> LeaderboardInner.Movement.WORSENED
            currentPosition < previousPosition -> LeaderboardInner.Movement.IMPROVED
            else -> LeaderboardInner.Movement.UNCHANGED
        }

        LeaderboardInner(currentPosition, user, movement)
    }
    return leaderboard
}

class LeaderboardS3Service(val s3Client: S3Client, val s3BucketName: String) : LeaderboardService {
    // Two separate caches:
    //  - latestMatchDay: the answer to "what's the latest matchDay we have?"
    //    Only updated by getLatestLeaderboardMatchDay (list-objects) and
    //    writeLeaderboard (we know matchDay N now exists, so latest >= N).
    //  - boardByMatchDay: map of matchDay -> leaderboard for getLeaderboard(N).
    //    Storing multiple days at once means getPreviousLeaderboard doesn't
    //    evict the current day's entry, which previously caused a stale
    //    matchDay-0 baseline to be served as the "latest" forever.
    private var latestMatchDay: Int? = null
    private var latestMatchDayTimestamp: Long = 0
    private val boardByMatchDay = mutableMapOf<Int, Pair<List<LeaderboardInner>, Long>>()
    private var cachedCountryRankings: List<CountryLeaderboardInner>? = null
    private var countryRankingsCacheTimestamp: Long = 0
    private val cacheTtlMs = System.getenv("CACHE_TTL_SECONDS")?.toLongOrNull()?.let { it * 1000 } ?: Long.MAX_VALUE

    override fun invalidateCache() {
        latestMatchDay = null
        boardByMatchDay.clear()
        cachedCountryRankings = null
    }

    override suspend fun writeLeaderboard(leaderboard: List<LeaderboardInner>, matchDay: Int) {
        val request = PutObjectRequest {
            bucket = s3BucketName
            key = "matchDay$matchDay.json"
            body = ByteStream.fromString(leaderboard.toJson())
        }
        s3Client.putObject(request)
        val now = System.currentTimeMillis()
        boardByMatchDay[matchDay] = leaderboard to now
        if (latestMatchDay == null || matchDay > latestMatchDay!!) {
            latestMatchDay = matchDay
            latestMatchDayTimestamp = now
        }
    }

    override suspend fun getLatestLeaderboardMatchDay(): Int {
        if (latestMatchDay != null && System.currentTimeMillis() - latestMatchDayTimestamp < cacheTtlMs) {
            return latestMatchDay!!
        }
        val listRequest = ListObjectsV2Request {
            bucket = s3BucketName
        }
        val listResponse = s3Client.listObjectsV2(listRequest)

        val computed = listResponse.contents
            ?.mapNotNull { it.key?.substringAfter("matchDay")?.substringBefore(".json")?.toIntOrNull() }
            ?.maxOrNull()
            ?: 0
        latestMatchDay = computed
        latestMatchDayTimestamp = System.currentTimeMillis()
        return computed
    }

    override suspend fun getLeaderboard(matchDay: Int): List<LeaderboardInner>? {
        boardByMatchDay[matchDay]?.let { (board, ts) ->
            if (System.currentTimeMillis() - ts < cacheTtlMs) return board
        }
        val request = GetObjectRequest {
            bucket = s3BucketName
            key = "matchDay$matchDay.json"
        }

        return try {
            s3Client.getObject(request) { resp ->
                val json = resp.body?.decodeToString()
                requireNotNull(json) { "Leaderboard is empty" }
                val leaderboard: List<LeaderboardInner> = json.fromJson()
                boardByMatchDay[matchDay] = leaderboard to System.currentTimeMillis()
                return@getObject leaderboard
            }
        } catch (e: Exception) {
            log.info("Error fetching leaderboard for matchDay $matchDay: $e")
            null
        }
    }

    override suspend fun getPreviousLeaderboard(matchDay: Int): List<LeaderboardInner>? {
        return if (matchDay == 0) {
            null
        } else {
            getLeaderboard(matchDay - 1)
        }
    }

    override suspend fun updateGlobalLeaderboard(matchDay: Int) {
        val previousDayLeaderboard = getPreviousLeaderboard(matchDay)
        val updatedGlobalLeaderboard = calculateGlobalLeaderboard(previousDayLeaderboard)
        writeLeaderboard(updatedGlobalLeaderboard, matchDay)
    }

    override suspend fun writeCountryRankings(rankings: List<CountryLeaderboardInner>) {
        val request = PutObjectRequest {
            bucket = s3BucketName
            key = COUNTRY_RANKINGS_KEY
            body = ByteStream.fromString(rankings.toJson())
        }
        s3Client.putObject(request)
        cachedCountryRankings = rankings
        countryRankingsCacheTimestamp = System.currentTimeMillis()
    }

    override suspend fun getCountryRankings(): List<CountryLeaderboardInner>? {
        if (cachedCountryRankings != null && System.currentTimeMillis() - countryRankingsCacheTimestamp < cacheTtlMs) {
            return cachedCountryRankings
        }
        val request = GetObjectRequest {
            bucket = s3BucketName
            key = COUNTRY_RANKINGS_KEY
        }

        return try {
            s3Client.getObject(request) { resp ->
                val json = resp.body?.decodeToString()
                requireNotNull(json) { "Country rankings are empty" }
                val rankings: List<CountryLeaderboardInner> = json.fromJson()
                cachedCountryRankings = rankings
                countryRankingsCacheTimestamp = System.currentTimeMillis()
                return@getObject rankings
            }
        } catch (e: Exception) {
            log.info("Error fetching country rankings: $e")
            null
        }
    }

    override suspend fun updateCountryRankings() {
        writeCountryRankings(calculateCountryRankings())
    }

    companion object {
        private const val COUNTRY_RANKINGS_KEY = "countryRankings.json"
    }
}
