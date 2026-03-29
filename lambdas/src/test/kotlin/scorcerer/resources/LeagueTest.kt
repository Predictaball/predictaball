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
import org.openapitools.server.models.League
import scorcerer.DatabaseTest
import scorcerer.givenLeagueExists
import scorcerer.givenUserExists
import scorcerer.givenUserInLeague
import scorcerer.server.db.tables.LeagueMembershipTable
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
        body.leagueId shouldBe "test-league"
    }

    @Test
    fun createLeagueWithExtraWhitespace() {
        val response = handler(Request(Method.POST, "/league").body("""{"leagueName":" Test    League "}"""))
        response.status shouldBe Status.OK
        val body: CreateLeague200Response = response.bodyString().fromJson()
        body.leagueId shouldBe "test-league"
    }

    @Test
    fun createLeagueWithSpecialCharacter() {
        val response = handler(Request(Method.POST, "/league").body("""{"leagueName":"Alex's Minions"}"""))
        response.status shouldBe Status.OK
        val body: CreateLeague200Response = response.bodyString().fromJson()
        body.leagueId shouldBe "alexs-minions"
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

    @Test
    fun createLeagueRaisesExceptionWhenLeagueExists() {
        givenLeagueExists("test-league", "Test League")
        val response = handler(Request(Method.POST, "/league").body("""{"leagueName":"Test League"}"""))
        response.status shouldBe Status.INTERNAL_SERVER_ERROR
    }
}
