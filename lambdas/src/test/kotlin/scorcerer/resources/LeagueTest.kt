package scorcerer.resources

import aws.sdk.kotlin.services.s3.S3Client
import io.kotest.matchers.shouldBe
import io.mockk.mockk
import org.http4k.core.Method
import org.http4k.core.Request
import org.http4k.core.RequestContexts
import org.http4k.core.Status
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.openapitools.server.models.CreateLeague200Response
import org.openapitools.server.models.GetLeagueLeaderboard200Response
import org.openapitools.server.models.League
import org.openapitools.server.models.Match
import scorcerer.DatabaseTest
import scorcerer.givenLeagueExists
import scorcerer.givenMatchExists
import scorcerer.givenPredictionExists
import scorcerer.givenTeamExists
import scorcerer.givenUserExists
import scorcerer.givenUserInLeague
import scorcerer.server.db.tables.LeagueMembershipTable
import scorcerer.server.db.tables.MatchRound
import scorcerer.server.fromJson
import scorcerer.server.resources.leagueRoutes
import scorcerer.utils.LeaderboardS3Service

class LeagueTest : DatabaseTest() {
    private val contexts = RequestContexts()
    private val mockS3Client: S3Client = mockk(relaxed = true)
    private val mockLeaderboardService = LeaderboardS3Service(mockS3Client, "bucketName")
    private val handler = testHandler(contexts, leagueRoutes(contexts, mockLeaderboardService))

    @BeforeEach
    fun generateUser() {
        givenUserExists("test-user", "name")
    }

    @Test
    fun createLeague() {
        val response = handler(Request(Method.POST, "/league").body("""{"leagueName":"Test League"}"""))
        response.status shouldBe Status.OK
        val body: CreateLeague200Response = response.bodyString().fromJson()
        body.leagueId!!.matches(UUID_REGEX) shouldBe true
    }

    @Test
    fun createLeagueWithSpecialCharacter() {
        val response = handler(Request(Method.POST, "/league").body("""{"leagueName":"Alex's Minions"}"""))
        response.status shouldBe Status.OK
        val body: CreateLeague200Response = response.bodyString().fromJson()
        body.leagueId!!.matches(UUID_REGEX) shouldBe true
    }

    @Test
    fun createLeagueAllowsDuplicateNames() {
        val first = handler(Request(Method.POST, "/league").body("""{"leagueName":"Test League"}"""))
        first.status shouldBe Status.OK
        val second = handler(Request(Method.POST, "/league").body("""{"leagueName":"Test League"}"""))
        second.status shouldBe Status.OK
        val firstId: CreateLeague200Response = first.bodyString().fromJson()
        val secondId: CreateLeague200Response = second.bodyString().fromJson()
        (firstId.leagueId == secondId.leagueId) shouldBe false
    }

    @Test
    fun getLeagueWhenNoUsersInLeague() {
        givenLeagueExists("test-league", "Test League")
        val response = handler(Request(Method.GET, "/league/test-league"))
        response.status shouldBe Status.OK
        val league: League = response.bodyString().fromJson()
        league.name shouldBe "Test League"
        league.leagueId shouldBe "test-league"
        league.users.size shouldBe 0
    }

    @Test
    fun getLeagueWhenUsersInLeague() {
        givenLeagueExists("test-league", "Test League")
        givenUserExists("anotherUserId", "Another User")
        givenUserInLeague("test-user", "test-league")
        givenUserInLeague("anotherUserId", "test-league")
        val response = handler(Request(Method.GET, "/league/test-league"))
        response.status shouldBe Status.OK
        val league: League = response.bodyString().fromJson()
        league.users.size shouldBe 2
    }

    @Test
    fun getLeagueRaisesWhenLeagueDoesNotExist() {
        val response = handler(Request(Method.GET, "/league/invalid-league"))
        response.status shouldBe Status.BAD_REQUEST
    }

    @Test
    fun leaveLeague() {
        val response = handler(Request(Method.POST, "/league/another-league/leave"))
        response.status shouldBe Status.OK
    }

    @Test
    fun joinLeague() {
        givenLeagueExists("test-league", "Test League")
        val response = handler(Request(Method.POST, "/league/test-league/join"))
        response.status shouldBe Status.OK
    }

    @Test
    fun leaderboardFilteredToGroupStageOnlyCountsGroupStagePoints() {
        givenLeagueExists("test-league", "Test League")
        givenUserInLeague("test-user", "test-league")
        givenUserExists("another-user", "Another")
        givenUserInLeague("another-user", "test-league")
        val home = givenTeamExists("Home")
        val away = givenTeamExists("Away")
        val groupStageMatch = givenMatchExists(home, away, matchState = Match.State.COMPLETED, round = MatchRound.GROUP_STAGE)
        val knockoutMatch = givenMatchExists(home, away, matchState = Match.State.COMPLETED, round = MatchRound.FINAL)
        givenPredictionExists(groupStageMatch, "test-user", 1, 0, points = 3)
        givenPredictionExists(knockoutMatch, "test-user", 1, 0, points = 5)
        givenPredictionExists(groupStageMatch, "another-user", 1, 0, points = 1)

        val response = handler(Request(Method.GET, "/league/test-league/leaderboard?stage=GROUP_STAGE"))
        response.status shouldBe Status.OK
        val body: GetLeagueLeaderboard200Response = response.bodyString().fromJson()
        val testUserEntry = body.leaderboard.find { it.user.userId == "test-user" }!!
        val anotherUserEntry = body.leaderboard.find { it.user.userId == "another-user" }!!
        testUserEntry.user.livePoints shouldBe 3
        anotherUserEntry.user.livePoints shouldBe 1
        testUserEntry.position shouldBe 1
    }

    @Test
    fun leaderboardFilteredToKnockoutOnlyCountsKnockoutPoints() {
        givenLeagueExists("test-league", "Test League")
        givenUserInLeague("test-user", "test-league")
        val home = givenTeamExists("Home")
        val away = givenTeamExists("Away")
        val groupStageMatch = givenMatchExists(home, away, matchState = Match.State.COMPLETED, round = MatchRound.GROUP_STAGE)
        val knockoutMatch = givenMatchExists(home, away, matchState = Match.State.COMPLETED, round = MatchRound.SEMI_FINAL)
        givenPredictionExists(groupStageMatch, "test-user", 1, 0, points = 3)
        givenPredictionExists(knockoutMatch, "test-user", 1, 0, points = 5)

        val response = handler(Request(Method.GET, "/league/test-league/leaderboard?stage=KNOCKOUT"))
        response.status shouldBe Status.OK
        val body: GetLeagueLeaderboard200Response = response.bodyString().fromJson()
        body.leaderboard.find { it.user.userId == "test-user" }!!.user.livePoints shouldBe 5
    }

    @Test
    fun leaderboardRejectsInvalidStage() {
        givenLeagueExists("test-league", "Test League")
        val response = handler(Request(Method.GET, "/league/test-league/leaderboard?stage=NOT_A_STAGE"))
        response.status shouldBe Status.BAD_REQUEST
    }

    @Test
    fun joinLeagueTwice() {
        givenLeagueExists("test-league", "Test League")
        handler(Request(Method.POST, "/league/test-league/join"))
        handler(Request(Method.POST, "/league/test-league/join"))
        val memberships = transaction {
            LeagueMembershipTable.selectAll()
                .where { (LeagueMembershipTable.leagueId eq "test-league") and (LeagueMembershipTable.memberId eq "test-user") }
                .count()
        }
        memberships shouldBe 1
    }
}

private val UUID_REGEX = Regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
