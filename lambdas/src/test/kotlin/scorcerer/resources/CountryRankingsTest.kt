package scorcerer.resources

import io.kotest.matchers.shouldBe
import kotlinx.coroutines.runBlocking
import org.http4k.core.Method
import org.http4k.core.Request
import org.http4k.core.RequestContexts
import org.http4k.core.Status
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.openapitools.server.models.GetCountryRankings200Response
import scorcerer.DatabaseTest
import scorcerer.givenMatchExists
import scorcerer.givenPredictionExists
import scorcerer.givenTeamExists
import scorcerer.givenUserExists
import scorcerer.server.fromJson
import scorcerer.server.resources.countryRankingsRoutes
import scorcerer.utils.LocalLeaderboardService

class CountryRankingsTest : DatabaseTest() {
    private val contexts = RequestContexts()
    private lateinit var leaderboardService: LocalLeaderboardService
    private lateinit var handler: org.http4k.core.HttpHandler

    @BeforeEach
    fun setup() {
        // Fresh service per test so cached snapshots don't leak between tests.
        leaderboardService = LocalLeaderboardService()
        handler = testHandler(contexts, countryRankingsRoutes(leaderboardService))
    }

    private fun getRankings(): GetCountryRankings200Response {
        val response = handler(Request(Method.GET, "/leaderboard/countries"))
        response.status shouldBe Status.OK
        return response.bodyString().fromJson()
    }

    @Test
    fun emptyWhenNoTeamsExist() {
        getRankings().rankings.size shouldBe 0
    }

    @Test
    fun includesCountriesWithNoPredictionsScoringZeroAtBottom() {
        val england = givenTeamExists("england")
        // Brazil has no supporters / predictions at all.
        givenTeamExists("brazil")
        val homeTeam = givenTeamExists("argentina")
        val awayTeam = givenTeamExists("spain")
        val match = givenMatchExists(homeTeam, awayTeam)

        givenUserExists("eng-1", "Eng", supportedTeamId = england)
        givenPredictionExists(match, "eng-1", 1, 0, points = 4)

        val rankings = getRankings().rankings
        // England (scored) plus the three teams that scored nothing.
        rankings.size shouldBe 4

        val first = rankings[0]
        first.position shouldBe 1
        first.teamName shouldBe "England"
        first.score shouldBe 4.0

        // Everyone else has zero points and shares the next position, ordered by name.
        val zeroScorers = rankings.drop(1)
        zeroScorers.map { it.teamName } shouldBe listOf("Argentina", "Brazil", "Spain")
        zeroScorers.forEach {
            it.position shouldBe 2
            it.score shouldBe 0.0
            it.predictedMatches shouldBe 0
            it.predictorCount shouldBe 0
        }
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

        val rankings = getRankings().rankings

        val first = rankings[0]
        first.position shouldBe 1
        first.teamName shouldBe "England"
        first.score shouldBe 5.0
        first.predictedMatches shouldBe 1
        first.predictorCount shouldBe 2

        val second = rankings[1]
        second.position shouldBe 2
        second.teamName shouldBe "France"
        second.score shouldBe 3.0
        second.predictorCount shouldBe 1

        // Brazil and Spain have no supporters and sit at the bottom on zero points.
        rankings.drop(2).map { it.teamName } shouldBe listOf("Brazil", "Spain")
        rankings.drop(2).forEach { it.score shouldBe 0.0 }
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

        val rankings = getRankings().rankings
        val englandRanking = rankings.single { it.teamName == "England" }
        englandRanking.score shouldBe 7.0
        englandRanking.predictedMatches shouldBe 2
    }

    @Test
    fun servesCachedSnapshotWithoutRecomputing() {
        val england = givenTeamExists("england")
        val homeTeam = givenTeamExists("brazil")
        val awayTeam = givenTeamExists("spain")
        val match = givenMatchExists(homeTeam, awayTeam)

        givenUserExists("eng-1", "Eng", supportedTeamId = england)
        givenPredictionExists(match, "eng-1", 1, 0, points = 4)

        fun englandScore() = getRankings().rankings.single { it.teamName == "England" }.score

        // First request populates the cache.
        englandScore() shouldBe 4.0

        // Underlying data changes, but without a score-update trigger the cached
        // snapshot is served unchanged (i.e. we are not recomputing per request).
        givenUserExists("eng-2", "Eng", supportedTeamId = england)
        givenPredictionExists(match, "eng-2", 1, 0, points = 8)
        englandScore() shouldBe 4.0

        // Refreshing the snapshot (as a score update would) picks up the new data.
        runBlocking { leaderboardService.updateCountryRankings() }
        englandScore() shouldBe 6.0
    }
}
