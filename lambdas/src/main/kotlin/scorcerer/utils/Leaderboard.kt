package scorcerer.utils

import aws.sdk.kotlin.services.s3.S3Client
import aws.sdk.kotlin.services.s3.model.GetObjectRequest
import aws.sdk.kotlin.services.s3.model.ListObjectsV2Request
import aws.sdk.kotlin.services.s3.model.PutObjectRequest
import aws.smithy.kotlin.runtime.content.ByteStream
import aws.smithy.kotlin.runtime.content.decodeToString
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.LeaderboardInner
import org.openapitools.server.models.User
import scorcerer.server.db.tables.LeagueMembershipTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.fromJson
import scorcerer.server.log
import scorcerer.server.toJson

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
            .select(
                MemberTable.id,
                MemberTable.firstName,
                MemberTable.familyName,
                MemberTable.fixedPoints,
            )
            .where { LeagueMembershipTable.leagueId eq "global" }
            .map {
                val userId = it[MemberTable.id]
                User(
                    it[MemberTable.firstName],
                    it[MemberTable.familyName],
                    userId,
                    it[MemberTable.fixedPoints],
                    livePoints[userId] ?: 0,
                )
            }
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
    private var cachedLeaderboard: List<LeaderboardInner>? = null
    private var cachedMatchDay: Int? = null
    private var cacheTimestamp: Long = 0
    private val cacheTtlMs = System.getenv("CACHE_TTL_SECONDS")?.toLongOrNull()?.let { it * 1000 } ?: Long.MAX_VALUE

    override fun invalidateCache() {
        cachedLeaderboard = null
        cachedMatchDay = null
    }

    override suspend fun writeLeaderboard(leaderboard: List<LeaderboardInner>, matchDay: Int) {
        val request = PutObjectRequest {
            bucket = s3BucketName
            key = "matchDay$matchDay.json"
            body = ByteStream.fromString(leaderboard.toJson())
        }
        s3Client.putObject(request)
        cachedLeaderboard = leaderboard
        cachedMatchDay = matchDay
        cacheTimestamp = System.currentTimeMillis()
    }

    override suspend fun getLatestLeaderboardMatchDay(): Int {
        if (cachedMatchDay != null && System.currentTimeMillis() - cacheTimestamp < cacheTtlMs) {
            return cachedMatchDay!!
        }
        val listRequest = ListObjectsV2Request {
            bucket = s3BucketName
        }
        val listResponse = s3Client.listObjectsV2(listRequest)

        val latestMatchDay = listResponse.contents
            ?.mapNotNull { it.key?.substringAfter("matchDay")?.substringBefore(".json")?.toIntOrNull() }
            ?.maxOrNull()
            ?: 0
        cachedMatchDay = latestMatchDay
        cacheTimestamp = System.currentTimeMillis()
        return latestMatchDay
    }

    override suspend fun getLeaderboard(matchDay: Int): List<LeaderboardInner>? {
        if (matchDay == cachedMatchDay && cachedLeaderboard != null && System.currentTimeMillis() - cacheTimestamp < cacheTtlMs) {
            return cachedLeaderboard
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
                cachedLeaderboard = leaderboard
                cachedMatchDay = matchDay
                cacheTimestamp = System.currentTimeMillis()
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
}
