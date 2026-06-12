package scorcerer.server.resources

import kotlinx.coroutines.runBlocking
import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.routes
import org.openapitools.server.models.GetCountryRankings200Response
import scorcerer.server.toJson
import scorcerer.utils.LeaderboardService
import scorcerer.utils.calculateCountryRankings

fun countryRankingsRoutes(leaderboardService: LeaderboardService) = routes(
    "/leaderboard/countries" bind Method.GET to {
        // Served from the cached snapshot, which is refreshed whenever scores change. The
        // cold path (empty cache / fresh instance) computes once and writes it back.
        val rankings = runBlocking {
            leaderboardService.getCountryRankings() ?: run {
                val computed = calculateCountryRankings()
                leaderboardService.writeCountryRankings(computed)
                computed
            }
        }
        Response(Status.OK).body(GetCountryRankings200Response(rankings).toJson())
    },
)
