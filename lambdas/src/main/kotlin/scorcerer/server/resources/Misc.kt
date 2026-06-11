package scorcerer.server.resources

import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.routes
import org.openapitools.server.models.TrackingEvent
import scorcerer.server.emitCount
import scorcerer.server.fromJson

val miscRoutes = routes(
    "/ping" bind Method.GET to { Response(Status.OK) },
    "/tracking/event" bind Method.POST to { req ->
        val body = req.bodyString().fromJson<TrackingEvent>()
        emitCount("${body.event}_fromSignup_${body.fromSignup}")
        Response(Status.OK)
    },
)
