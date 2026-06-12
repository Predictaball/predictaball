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
    fun emptyWhenNoCountriesRepresented() {
        getRankings().rankings.size shouldBe 0
    }

    @Test
    fun includesRepresentedCountriesWithoutScoredPredictions() {
        val england = givenTeamExists("england")
        val france = givenTeamExists("france")
        val homeTeam = givenTeamExists("brazil")
        val awayTeam = givenTeamExists("spain")

        val match = givenMatchExists(homeTeam, awayTeam)

        // England has a supporter who scored a prediction.
        givenUserExists("eng-1", "Eng", supportedTeamId = england)
        givenPredictionExists(match, "eng-1", 1, 0, points = 6)

        // France is represented (has a supporter) but no scored predictions yet.
        givenUserExists("fra-1", "Fra", supportedTeamId = france)

        val rankings = getRankings().rankings
        rankings.size shouldBe 2

        val first = rankings[0]
        first.position shouldBe 1
        first.teamName shouldBe "England"
        first.score shouldBe 6.0
        first.predictedMatches shouldBe 1
        first.predictorCount shouldBe 1

        val second = rankings[1]
        second.position shouldBe 2
        second.teamName shouldBe "France"
        second.leagueId shouldBe "france"
        second.score shouldBe 0.0
        second.predictedMatches shouldBe 0
        second.predictorCount shouldBe 0
    }

    @Test
    fun unsupportedTeamsAreNotRepresented() {
        // brazil and spain only appear as match participants — nobody supports
        // them — so they must not show up in the country rankings.
        val england = givenTeamExists("england")
        val homeTeam = givenTeamExists("brazil")
        val awayTeam = givenTeamExists("spain")
        val match = givenMatchExists(homeTeam, awayTeam)

        givenUserExists("eng-1", "Eng", supportedTeamId = england)
        givenPredictionExists(match, "eng-1", 1, 0, points = 4)

        val rankings = getRankings().rankings
        rankings.size shouldBe 1
        rankings.single().teamName shouldBe "England"
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
        rankings.size shouldBe 2

        val first = rankings[0]
        first.position shouldBe 1
        first.teamName shouldBe "England"
        first.leagueId shouldBe "england"
        first.score shouldBe 5.0
        first.predictedMatches shouldBe 1
        first.predictorCount shouldBe 2

        val second = rankings[1]
        second.position shouldBe 2
        second.teamName shouldBe "France"
        second.leagueId shouldBe "france"
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

        val rankings = getRankings().rankings
        rankings.size shouldBe 1
        rankings[0].score shouldBe 7.0
        rankings[0].predictedMatches shouldBe 2
    }

    @Test
    fun servesCachedSnapshotWithoutRecomputing() {
        val england = givenTeamExists("england")
        val homeTeam = givenTeamExists("brazil")
        val awayTeam = givenTeamExists("spain")
        val match = givenMatchExists(homeTeam, awayTeam)

        givenUserExists("eng-1", "Eng", supportedTeamId = england)
        givenPredictionExists(match, "eng-1", 1, 0, points = 4)

        // First request populates the cache.
        getRankings().rankings.single().score shouldBe 4.0

        // Underlying data changes, but without a score-update trigger the cached
        // snapshot is served unchanged (i.e. we are not recomputing per request).
        givenUserExists("eng-2", "Eng", supportedTeamId = england)
        givenPredictionExists(match, "eng-2", 1, 0, points = 8)
        getRankings().rankings.single().score shouldBe 4.0

        // Refreshing the snapshot (as a score update would) picks up the new data.
        runBlocking { leaderboardService.updateCountryRankings() }
        getRankings().rankings.single().score shouldBe 6.0
    }
}
