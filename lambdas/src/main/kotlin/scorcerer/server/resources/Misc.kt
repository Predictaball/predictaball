package scorcerer.server.resources

import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.routes

val miscRoutes = routes(
    "/ping" bind Method.GET to { Response(Status.OK) },
)
