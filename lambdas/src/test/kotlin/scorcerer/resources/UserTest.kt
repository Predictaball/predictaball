package scorcerer.resources

import io.kotest.matchers.shouldBe
import org.http4k.core.Method
import org.http4k.core.Request
import org.http4k.core.RequestContexts
import org.http4k.core.Status
import org.junit.jupiter.api.Test
import org.openapitools.server.models.GetUserPoints200Response
import org.openapitools.server.models.Prediction
import scorcerer.DatabaseTest
import scorcerer.givenLeagueExists
import scorcerer.givenMatchExists
import scorcerer.givenPredictionExists
import scorcerer.givenTeamExists
import scorcerer.givenUserExists
import scorcerer.givenUserInLeague
import scorcerer.server.fromJson
import scorcerer.server.resources.userRoutes

class UserTest : DatabaseTest() {
    private val contexts = RequestContexts()
    private val handler = testHandler(contexts, userRoutes(contexts))

    @Test
    fun getUserPoints() {
        givenUserExists("userId", "name", fixedPoints = 15, livePoints = 5)
        val response = handler(Request(Method.GET, "/user/userId/points"))
        response.status shouldBe Status.OK
        val points: GetUserPoints200Response = response.bodyString().fromJson()
        points.livePoints shouldBe 5
        points.fixedPoints shouldBe 15
    }

    @Test
    fun getUserPredictions() {
        val userId = "userId"
        givenUserExists(userId, "name", fixedPoints = 15, livePoints = 5)
        val homeTeamId = givenTeamExists("England")
        val awayTeamId = givenTeamExists("France")
        val matchId = givenMatchExists(homeTeamId, awayTeamId)
        givenPredictionExists(matchId, userId, 1, 1)
        val response = handler(Request(Method.GET, "/user/$userId/predictions"))
        response.status shouldBe Status.OK
        val predictions: List<Prediction> = response.bodyString().fromJson()
        predictions.size shouldBe 1
    }

    @Test
    fun getUserLeagues() {
        givenUserExists("test-user", "name0")
        givenUserExists("user5", "name5")
        givenUserExists("user6", "name6")
        givenUserExists("user7", "name7")
        givenUserExists("user3", "name3")
        givenUserExists("user4", "name4")
        givenLeagueExists("league1", "First League")
        givenLeagueExists("league2", "Second League")

        givenUserInLeague("test-user", "league1")
        givenUserInLeague("user5", "league1")
        givenUserInLeague("user6", "league1")
        givenUserInLeague("user7", "league1")

        givenUserInLeague("test-user", "league2")
        givenUserInLeague("user3", "league2")
        givenUserInLeague("user4", "league2")
        givenUserInLeague("user5", "league2")

        val response = handler(Request(Method.GET, "/user/leagues"))
        response.status shouldBe Status.OK
    }
}
