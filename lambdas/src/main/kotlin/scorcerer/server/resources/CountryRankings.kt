package scorcerer.server.resources

import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.routes
import org.openapitools.server.models.GetCountryRankings200Response
import scorcerer.server.toJson
import scorcerer.utils.calculateCountryRankings

fun countryRankingsRoutes() = routes(
    "/leaderboard/countries" bind Method.GET to {
        Response(Status.OK).body(GetCountryRankings200Response(calculateCountryRankings()).toJson())
    },
)
