package scorcerer.resources

import io.kotest.matchers.shouldBe
import org.http4k.core.Method
import org.http4k.core.Request
import org.http4k.core.RequestContexts
import org.http4k.core.Status
import org.junit.jupiter.api.Test
import org.openapitools.server.models.GetCountryRankings200Response
import scorcerer.DatabaseTest
import scorcerer.givenMatchExists
import scorcerer.givenPredictionExists
import scorcerer.givenTeamExists
import scorcerer.givenUserExists
import scorcerer.server.fromJson
import scorcerer.server.resources.countryRankingsRoutes

class CountryRankingsTest : DatabaseTest() {
    private val contexts = RequestContexts()
    private val handler = testHandler(contexts, countryRankingsRoutes())

    @Test
    fun emptyWhenNoScoredPredictions() {
        val response = handler(Request(Method.GET, "/leaderboard/countries"))
        response.status shouldBe Status.OK
        val body: GetCountryRankings200Response = response.bodyString().fromJson()
        body.rankings.size shouldBe 0
    }

    @Test
    fun ranksCountriesByAverageOfSupporterPoints() {
        val england = givenTeamExists("england")
        val france = givenTeamExists("france")
        val homeTeam = givenTeamExists("brazil")
        val awayTeam = givenTeamExists("spain")

        val match = givenMatchExists(homeTeam, awayTeam)

        // England has two supporters who predicted (8 and 2 -> avg 5).
        givenUserExists("eng-1", "Eng", supportedTeamId = england)
        givenUserExists("eng-2", "Eng", supportedTeamId = england)
        // England supporter who did NOT predict: must be ignored.
        givenUserExists("eng-3", "Eng", supportedTeamId = england)
        givenPredictionExists(match, "eng-1", 1, 0, points = 8)
        givenPredictionExists(match, "eng-2", 1, 0, points = 2)

        // France has one supporter who predicted (3 -> avg 3).
        givenUserExists("fra-1", "Fra", supportedTeamId = france)
        givenPredictionExists(match, "fra-1", 1, 0, points = 3)

        val response = handler(Request(Method.GET, "/leaderboard/countries"))
        response.status shouldBe Status.OK
        val body: GetCountryRankings200Response = response.bodyString().fromJson()

        body.rankings.size shouldBe 2

        val first = body.rankings[0]
        first.position shouldBe 1
        first.teamName shouldBe "England"
        first.score shouldBe 5.0
        first.predictedMatches shouldBe 1
        first.predictorCount shouldBe 2

        val second = body.rankings[1]
        second.position shouldBe 2
        second.teamName shouldBe "France"
        second.score shouldBe 3.0
        second.predictorCount shouldBe 1
    }

    @Test
    fun sumsPerMatchAveragesAcrossMatches() {
        val england = givenTeamExists("england")
        val homeTeam = givenTeamExists("brazil")
        val awayTeam = givenTeamExists("spain")

        val matchOne = givenMatchExists(homeTeam, awayTeam)
        val matchTwo = givenMatchExists(homeTeam, awayTeam)

        givenUserExists("eng-1", "Eng", supportedTeamId = england)
        givenUserExists("eng-2", "Eng", supportedTeamId = england)
        // Match one: avg of 5 and 1 = 3. Match two: only one predictor = 4.
        givenPredictionExists(matchOne, "eng-1", 1, 0, points = 5)
        givenPredictionExists(matchOne, "eng-2", 1, 0, points = 1)
        givenPredictionExists(matchTwo, "eng-1", 1, 0, points = 4)

        val response = handler(Request(Method.GET, "/leaderboard/countries"))
        response.status shouldBe Status.OK
        val body: GetCountryRankings200Response = response.bodyString().fromJson()

        body.rankings.size shouldBe 1
        body.rankings[0].score shouldBe 7.0
        body.rankings[0].predictedMatches shouldBe 2
    }
}
