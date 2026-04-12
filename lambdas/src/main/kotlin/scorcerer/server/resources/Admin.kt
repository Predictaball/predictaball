package scorcerer.server.resources

import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.routes
import scorcerer.server.log
import scorcerer.server.schedule.MatchStarter
import scorcerer.server.schedule.ScoreUpdater
import scorcerer.server.services.recalculateAllFixedPoints
import scorcerer.utils.LeaderboardService

fun adminRoutes(leaderboardService: LeaderboardService) = routes(
    // TODO: Add API key validation (check X-Api-Key header against env var)
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
)
