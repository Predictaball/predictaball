package scorcerer.server.resources

import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.routes
import scorcerer.server.services.TournamentStateService
import scorcerer.server.toJson

fun tournamentRoutes(tournamentStateService: TournamentStateService) = routes(
    "/tournament/state" bind Method.GET to {
        Response(Status.OK).body(tournamentStateService.getState().toJson())
    },
)
