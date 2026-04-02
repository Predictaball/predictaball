package scorcerer.resources

import io.kotest.matchers.shouldBe
import io.mockk.coVerify
import io.mockk.coVerifySequence
import io.mockk.mockk
import org.http4k.core.Method
import org.http4k.core.Request
import org.http4k.core.RequestContexts
import org.http4k.core.Status
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.openapitools.server.models.Match
import org.openapitools.server.models.Prediction
import scorcerer.DatabaseTest
import scorcerer.givenLeagueExists
import scorcerer.givenMatchExists
import scorcerer.givenPredictionExists
import scorcerer.givenTeamExists
import scorcerer.givenUserExists
import scorcerer.givenUserInLeague
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.fromJson
import scorcerer.server.resources.getMatchesOnNextThreeDays
import scorcerer.server.resources.matchRoutes
import scorcerer.server.services.endMatch
import scorcerer.server.services.setScore
import scorcerer.utils.LeaderboardS3Service
import scorcerer.utils.MatchResult
import java.time.OffsetDateTime

class MatchTest : DatabaseTest() {
    private val contexts = RequestContexts()
    private val mockLeaderboardService = mockk<LeaderboardS3Service>(relaxed = true)
    private val handler = testHandler(contexts, matchRoutes(contexts, mockLeaderboardService))

    @BeforeEach
    fun generateTeams() {
        givenTeamExists("England")
        givenTeamExists("France")
        givenTeamExists("Spain")
        givenTeamExists("Scotland")
    }

    @Test
    fun createMatch() {
        val response = handler(Request(Method.POST, "/match").body("""{"homeTeamId":"1","awayTeamId":"2","datetime":"${OffsetDateTime.now()}","venue":"Allianz","matchDay":1,"matchRound":"GROUP_STAGE"}"""))
        response.status shouldBe Status.OK
    }

    @Test
    fun listMatches() {
        givenMatchExists("1", "2")
        givenMatchExists("3", "4")
        givenUserExists("test-user", "Test")
        givenPredictionExists("1", "test-user", 3, 4)

        val response = handler(Request(Method.GET, "/match/list"))
        response.status shouldBe Status.OK
        val matches: List<Match> = response.bodyString().fromJson()
        matches.size shouldBe 2
        matches.first().prediction shouldBe Prediction(3, 4, "1", "1", "test-user", null)
    }

    @Test
    fun listMatchesFilteredByState() {
        givenMatchExists("1", "2")
        givenMatchExists("3", "4")
        givenUserExists("test-user", "Test")

        val upcoming = handler(Request(Method.GET, "/match/list?filterType=upcoming"))
        (upcoming.bodyString().fromJson<List<Match>>()).size shouldBe 2

        val completed = handler(Request(Method.GET, "/match/list?filterType=completed"))
        (completed.bodyString().fromJson<List<Match>>()).size shouldBe 0

        val live = handler(Request(Method.GET, "/match/list?filterType=live"))
        (live.bodyString().fromJson<List<Match>>()).size shouldBe 0
    }

    @Test
    fun errorWhenViewingOtherUsersPredictions() {
        givenUserExists("test-user", "Test")
        val response = handler(Request(Method.GET, "/match/list?filterType=upcoming&userId=other-user"))
        response.status shouldBe Status.BAD_REQUEST
    }

    @Test
    fun getMatchPredictionsWhenNoMatchRaisesError() {
        val response = handler(Request(Method.GET, "/match/999/predictions"))
        response.status shouldBe Status.NOT_FOUND
    }

    @Test
    fun getMatchPredictionsWhenMatchUpcomingRaisesError() {
        val matchId = givenMatchExists("3", "4")
        val response = handler(Request(Method.GET, "/match/$matchId/predictions"))
        response.status shouldBe Status.BAD_REQUEST
    }

    @Test
    fun setMatchScoreWhenMatchDoesNotExistRaises() {
        val response = handler(Request(Method.POST, "/match/999/score").body("""{"homeScore":1,"awayScore":2}"""))
        response.status shouldBe Status.BAD_REQUEST
    }

    @Test
    fun getMatchPredictionsWithNoLeagueFilter() {
        val userId = "userId"
        givenUserExists(userId, "name")
        val anotherUserId = "anotherUser"
        givenUserExists(anotherUserId, "name")
        val matchId = givenMatchExists("3", "4", matchState = Match.State.LIVE)
        givenPredictionExists(matchId, userId, 1, 1)
        givenPredictionExists(matchId, anotherUserId, 1, 1)
        givenLeagueExists("test-league", "Test League")
        givenUserInLeague(userId, "test-league")
        givenLeagueExists("another-test-league", "Test League")
        givenUserInLeague(anotherUserId, "another-test-league")

        val response = handler(Request(Method.GET, "/match/$matchId/predictions"))
        response.status shouldBe Status.OK
        val predictions: List<org.openapitools.server.models.PredictionWithUser> = response.bodyString().fromJson()
        predictions.size shouldBe 2
    }

    @Test
    fun getMatchPredictionsWithLeagueFilter() {
        val userId = "userId"
        givenUserExists(userId, "name", fixedPoints = 0)
        val anotherUserId = "anotherUser"
        givenUserExists(anotherUserId, "name", fixedPoints = 0)
        val matchId = givenMatchExists("3", "4", matchState = Match.State.LIVE)
        givenPredictionExists(matchId, userId, 1, 1)
        givenPredictionExists(matchId, anotherUserId, 1, 1)
        givenLeagueExists("test-league", "Test League")
        givenUserInLeague(userId, "test-league")
        givenLeagueExists("another-test-league", "Test League")
        givenUserInLeague(anotherUserId, "another-test-league")

        val response = handler(Request(Method.GET, "/match/$matchId/predictions?leagueId=test-league"))
        response.status shouldBe Status.OK
        val predictions: List<org.openapitools.server.models.PredictionWithUser> = response.bodyString().fromJson()
        predictions.size shouldBe 1
        predictions[0].user.userId shouldBe userId
    }

    @Test
    fun setMatchScoreWhenMatchExistsUpdatesScore() {
        val matchId = givenMatchExists("1", "2")
        setScore(matchId, 1, 1, 2, mockLeaderboardService)
        val match = transaction {
            MatchTable.selectAll().where { MatchTable.id eq matchId.toInt() }.map { row ->
                MatchResult(row[MatchTable.homeScore] ?: 0, row[MatchTable.awayScore] ?: 0)
            }
        }[0]
        match.awayScore shouldBe 2
        match.homeScore shouldBe 1
    }

    @Test
    fun setMatchScoreWhenPredictionExistsUpdatesPoints() {
        val matchId = givenMatchExists("1", "2", matchDay = 5)
        givenUserExists("userId", "name")
        val predictionId = givenPredictionExists(matchId, "userId", 1, 1)
        getPredictionPoints(predictionId) shouldBe null

        setScore(matchId, 5, 0, 0, mockLeaderboardService)
        getPredictionPoints(predictionId) shouldBe 2

        setScore(matchId, 5, 1, 1, mockLeaderboardService)
        getPredictionPoints(predictionId) shouldBe 5
        coVerifySequence {
            mockLeaderboardService.updateGlobalLeaderboard(5)
            mockLeaderboardService.updateGlobalLeaderboard(5)
        }
    }

    @Test
    fun completeMatch() {
        val matchId = givenMatchExists("1", "2")
        givenUserExists("userId", "name")
        givenUserExists("anotherUser", "name", fixedPoints = 1)
        givenPredictionExists(matchId, "userId", 2, 1)
        givenPredictionExists(matchId, "anotherUser", 1, 0)

        setScore(matchId, 1, 1, 1, mockLeaderboardService)
        endMatch(matchId, 2, 1, mockLeaderboardService)
        getFixedPoints("userId") shouldBe 5
        getFixedPoints("anotherUser") shouldBe 3
        transaction {
            MatchTable.select(MatchTable.state).where { MatchTable.id eq matchId.toInt() }
                .map { it[MatchTable.state] }[0]
        } shouldBe Match.State.COMPLETED
        coVerify { mockLeaderboardService.updateGlobalLeaderboard(1) }
    }

    @Test
    fun setMatchScoreWhenOtherLiveGame() {
        val matchId = givenMatchExists("1", "2")
        val anotherMatchId = givenMatchExists("1", "2")
        givenUserExists("userId", "name")
        givenUserExists("userNoPredictions", "name")
        val predictionA = givenPredictionExists(matchId, "userId", 1, 1)
        val predictionB = givenPredictionExists(anotherMatchId, "userId", 1, 0)

        setScore(matchId, 1, 0, 0, mockLeaderboardService)
        getPredictionPoints(predictionA) shouldBe 2

        setScore(anotherMatchId, 1, 0, 0, mockLeaderboardService)
        getPredictionPoints(predictionB) shouldBe 0

        setScore(anotherMatchId, 1, 1, 0, mockLeaderboardService)
        getPredictionPoints(predictionA) shouldBe 2
        getPredictionPoints(predictionB) shouldBe 5
        coVerify { mockLeaderboardService.updateGlobalLeaderboard(1) }
    }

    @Test
    fun completeMatchGivenLiveMatch() {
        val matchId = givenMatchExists("1", "2")
        val anotherMatchId = givenMatchExists("1", "2")
        setScore(anotherMatchId, 1, 0, 0, mockLeaderboardService)
        givenUserExists("userId", "name")
        givenUserExists("anotherUser", "name", fixedPoints = 1)
        val predA1 = givenPredictionExists(matchId, "userId", 2, 1)
        val predA2 = givenPredictionExists(matchId, "anotherUser", 1, 0)
        val predB1 = givenPredictionExists(anotherMatchId, "userId", 0, 0)
        val predB2 = givenPredictionExists(anotherMatchId, "anotherUser", 1, 1)

        setScore(matchId, 1, 2, 1, mockLeaderboardService)
        setScore(anotherMatchId, 1, 0, 0, mockLeaderboardService)
        getPredictionPoints(predA1) shouldBe 5
        getPredictionPoints(predA2) shouldBe 2
        getPredictionPoints(predB1) shouldBe 5
        getPredictionPoints(predB2) shouldBe 2
        getFixedPoints("userId") shouldBe 0
        getFixedPoints("anotherUser") shouldBe 1

        endMatch(matchId, 2, 1, mockLeaderboardService)
        getPredictionPoints(predB1) shouldBe 5
        getPredictionPoints(predB2) shouldBe 2
        getFixedPoints("userId") shouldBe 5
        getFixedPoints("anotherUser") shouldBe 3
        transaction {
            MatchTable.select(MatchTable.state).where { MatchTable.id eq matchId.toInt() }
                .map { it[MatchTable.state] }[0]
        } shouldBe Match.State.COMPLETED
        coVerify { mockLeaderboardService.updateGlobalLeaderboard(1) }
    }
}

class GetMatchesOnNextThreeDaysTest {
    @Test
    fun testWithMultipleMatchDays() {
        val matches = listOf(
            Match("Team A", "flagA", "Team B", "flagB", "1", "Stadium A", OffsetDateTime.now(), 1, Match.Round.GROUP_STAGE, Match.State.UPCOMING),
            Match("Team C", "flagC", "Team D", "flagD", "2", "Stadium B", OffsetDateTime.now(), 2, Match.Round.GROUP_STAGE, Match.State.UPCOMING),
            Match("Team E", "flagE", "Team F", "flagF", "3", "Stadium C", OffsetDateTime.now(), 2, Match.Round.GROUP_STAGE, Match.State.UPCOMING),
            Match("Team G", "flagG", "Team H", "flagH", "4", "Stadium D", OffsetDateTime.now(), 3, Match.Round.GROUP_STAGE, Match.State.UPCOMING),
            Match("Team G", "flagG", "Team H", "flagH", "4", "Stadium D", OffsetDateTime.now(), 4, Match.Round.GROUP_STAGE, Match.State.UPCOMING),
        )
        val filteredMatches = getMatchesOnNextThreeDays(matches)
        filteredMatches.size shouldBe 4
        filteredMatches.all { it.matchDay in listOf(1, 2, 3) } shouldBe true
    }

    @Test
    fun testWithLessThanNMatchDays() {
        val matches = listOf(
            Match("Team A", "flagA", "Team B", "flagB", "1", "Stadium A", OffsetDateTime.now(), 1, Match.Round.GROUP_STAGE, Match.State.UPCOMING),
            Match("Team C", "flagC", "Team D", "flagD", "2", "Stadium B", OffsetDateTime.now(), 1, Match.Round.GROUP_STAGE, Match.State.UPCOMING),
        )
        val filteredMatches = getMatchesOnNextThreeDays(matches)
        filteredMatches.size shouldBe 2
    }

    @Test
    fun testWithNoMatches() {
        val filteredMatches = getMatchesOnNextThreeDays(emptyList())
        filteredMatches.size shouldBe 0
    }
}

private fun getFixedPoints(memberId: String): Int = transaction {
    MemberTable.select(MemberTable.fixedPoints).where { MemberTable.id eq memberId }.map { it[MemberTable.fixedPoints] }[0]
}

private fun getPredictionPoints(predictionId: String): Int? = transaction {
    PredictionTable.select(PredictionTable.points).where { PredictionTable.id eq predictionId.toInt() }.map { it[PredictionTable.points] }[0]
}
