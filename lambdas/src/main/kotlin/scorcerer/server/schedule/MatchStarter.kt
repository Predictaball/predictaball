package scorcerer.server.schedule

import aws.sdk.kotlin.services.s3.model.PutObjectRequest
import aws.smithy.kotlin.runtime.content.ByteStream
import kotlinx.coroutines.runBlocking
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.Match
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.log
import scorcerer.server.resources.getMatchDay
import scorcerer.server.resources.setScore
import scorcerer.server.toJson
import scorcerer.utils.LeaderboardS3Service
import java.time.Clock
import java.time.OffsetDateTime

class MatchStarter(private val leaderboardService: LeaderboardS3Service) {
    fun run() {
        log.info("Checking for games which have started")

        val clock = Clock.systemDefaultZone()
        val now = OffsetDateTime.now(clock).plusMinutes(1)
        log.info("Using now - $now")

        transaction {
            val matchesWhichHaveStarted = MatchTable
                .selectAll()
                .where((MatchTable.datetime less now) and (MatchTable.state eq Match.State.UPCOMING))

            log.info("Found ${matchesWhichHaveStarted.count()} games which have already started")

            matchesWhichHaveStarted.forEach {
                val matchId = it[MatchTable.id].toString()
                log.info("Starting match ${it[MatchTable.id]}")

                val matchDay = getMatchDay(matchId)!!
                setScore(matchId, matchDay, 0, 0, leaderboardService)
            }
        }

        log.info("All required matches started")

        updateLiveMatches(leaderboardService)
    }
}

fun updateLiveMatches(leaderboardService: LeaderboardS3Service) {
    val liveMatches = transaction {
        MatchTable
            .selectAll()
            .where(MatchTable.state eq Match.State.LIVE)
            .filter { it.getOrNull(MatchTable.fotmobMatchId) != null }
            .map { LiveMatch(it[MatchTable.id].toString(), it[MatchTable.fotmobMatchId]!!) }
    }

    val putObjectRequest = PutObjectRequest {
        bucket = leaderboardService.s3BucketName
        key = liveMatchesKey
        body = ByteStream.fromString(liveMatches.toJson())
    }

    runBlocking {
        leaderboardService.s3Client.putObject(putObjectRequest)
    }

    log.info("Updated live matches to $liveMatches")
}
