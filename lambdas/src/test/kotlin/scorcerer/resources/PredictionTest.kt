package scorcerer.resources

import io.kotest.matchers.shouldBe
import org.http4k.core.Method
import org.http4k.core.Request
import org.http4k.core.RequestContexts
import org.http4k.core.Status
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Test
import scorcerer.DatabaseTest
import scorcerer.givenMatchExists
import scorcerer.givenPredictionExists
import scorcerer.givenTeamExists
import scorcerer.givenUserExists
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.fromJson
import scorcerer.server.resources.predictionRoutes
import java.time.OffsetDateTime
import org.openapitools.server.models.Prediction as PredictionModel

class PredictionTest : DatabaseTest() {
    private val contexts = RequestContexts()
    private val handler = testHandler(contexts, predictionRoutes(contexts))

    @Test
    fun createPrediction() {
        givenUserExists("test-user", "name")
        val homeTeamId = givenTeamExists("England")
        val awayTeamId = givenTeamExists("Scotland")
        val matchId = givenMatchExists(homeTeamId, awayTeamId, OffsetDateTime.now().plusHours(1))
        val response = handler(Request(Method.POST, "/prediction").body("""{"homeScore":1,"awayScore":2,"matchId":"$matchId"}"""))
        response.status shouldBe Status.OK
    }

    @Test
    fun createPredictionGivenPredictionExistsUpdates() {
        givenUserExists("test-user", "name")
        val homeTeamId = givenTeamExists("England")
        val awayTeamId = givenTeamExists("Scotland")
        val matchId = givenMatchExists(homeTeamId, awayTeamId, OffsetDateTime.now().plusHours(1))
        val predictionId = givenPredictionExists(matchId, "test-user", 1, 1)
        handler(Request(Method.POST, "/prediction").body("""{"homeScore":1,"awayScore":2,"matchId":"$matchId"}"""))
        transaction {
            PredictionTable.selectAll().where { PredictionTable.id eq predictionId.toInt() }.map { row ->
                row[PredictionTable.homeScore] shouldBe 1
                row[PredictionTable.awayScore] shouldBe 2
                row[PredictionTable.matchId] shouldBe matchId.toInt()
                row[PredictionTable.memberId] shouldBe "test-user"
            }
        }
    }

    @Test
    fun createPredictionGivenMatchStartedRaisesError() {
        givenUserExists("test-user", "name")
        val homeTeamId = givenTeamExists("England")
        val awayTeamId = givenTeamExists("Scotland")
        val matchId = givenMatchExists(homeTeamId, awayTeamId, OffsetDateTime.now().minusHours(1))
        val response = handler(Request(Method.POST, "/prediction").body("""{"homeScore":1,"awayScore":2,"matchId":"$matchId"}"""))
        response.status shouldBe Status.BAD_REQUEST
    }

    @Test
    fun getPredictionGivenUserPredictionExists() {
        givenUserExists("test-user", "name")
        val homeTeamId = givenTeamExists("England")
        val awayTeamId = givenTeamExists("Scotland")
        val matchId = givenMatchExists(homeTeamId, awayTeamId, OffsetDateTime.now().minusHours(1))
        val predictionId = givenPredictionExists(matchId, "test-user", 1, 1)
        val response = handler(Request(Method.GET, "/prediction/$matchId"))
        response.status shouldBe Status.OK
        val prediction: PredictionModel = response.bodyString().fromJson()
        prediction shouldBe PredictionModel(1, 1, matchId, predictionId, "test-user")
    }

    @Test
    fun getPredictionGivenNoPredictionRaisesNotFound() {
        givenUserExists("test-user", "name")
        val response = handler(Request(Method.GET, "/prediction/1"))
        response.status shouldBe Status.NOT_FOUND
    }
}
