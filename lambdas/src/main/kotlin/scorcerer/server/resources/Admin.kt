package scorcerer.server.resources

import org.http4k.core.Filter
import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.core.then
import org.http4k.routing.bind
import org.http4k.routing.routes
import scorcerer.server.log
import scorcerer.server.schedule.MatchStarter
import scorcerer.server.schedule.ScoreUpdater
import scorcerer.server.services.recalculateAllFixedPoints
import scorcerer.utils.LeaderboardService

private val adminApiKey = System.getenv("ADMIN_API_KEY")

private val requireApiKey = Filter { next ->
    { req ->
        if (adminApiKey != null && req.header("X-Api-Key") != adminApiKey) {
            Response(Status.UNAUTHORIZED).body("Invalid API key")
        } else {
            next(req)
        }
    }
}

fun adminRoutes(leaderboardService: LeaderboardService) = requireApiKey.then(
    routes(
        "/admin/start-matches" bind Method.POST to {
            log.info("Admin: start-matches triggered")
            runCatching { MatchStarter(leaderboardService).run() }
                .onFailure { log.error(it.stackTraceToString()) }
            Response(Status.OK)
        },
        "/admin/update-scores" bind Method.POST to {
            log.info("Admin: update-scores triggered")
            runCatching { ScoreUpdater(leaderboardService).run() }
                .onFailure { log.error(it.stackTraceToString()) }
            Response(Status.OK)
        },
        "/admin/recalculate-points" bind Method.POST to {
            log.info("Admin: recalculate-points triggered")
            runCatching { recalculateAllFixedPoints() }
                .onFailure { log.error(it.stackTraceToString()) }
            Response(Status.OK)
        },
    ),
)
