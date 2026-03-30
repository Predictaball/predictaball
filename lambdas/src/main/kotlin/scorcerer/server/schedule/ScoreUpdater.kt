package scorcerer.server.schedule

import aws.sdk.kotlin.services.s3.S3Client
import aws.sdk.kotlin.services.s3.model.GetObjectRequest
import aws.smithy.kotlin.runtime.content.decodeToString
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import kotlinx.coroutines.runBlocking
import org.http4k.client.JavaHttpClient
import org.http4k.core.Method
import org.http4k.core.Request
import scorcerer.server.Environment
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
    val fotmobMatchId: String,
)

val liveMatchesKey = "live-matches.json"

class ScoreUpdater(private val leaderboardService: LeaderboardS3Service) {
    private val client = JavaHttpClient()
    private val s3Client = S3Client { region = "eu-west-2" }
    private val endpoint = "https://www.fotmob.com/api/matchDetails?matchId="

    fun run() {
        log.info("Fetching the live matches from S3")

        val liveMatches = runBlocking {
            s3Client.getObject(
                GetObjectRequest {
                    bucket = Environment.LeaderboardBucketName
                    key = liveMatchesKey
                },
            ) {
                it.body?.decodeToString()?.fromJson<List<LiveMatch>>()
            }
        }

        if (liveMatches.isNullOrEmpty()) {
            log.info("No live matches")
            return
        }

        liveMatches.forEach {
            log.info("Fetching for $it")
            val response = client(Request(Method.GET, endpoint + it.fotmobMatchId))

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
