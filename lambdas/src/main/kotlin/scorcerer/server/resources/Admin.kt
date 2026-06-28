package scorcerer.server.resources

import org.http4k.core.Filter
import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.core.then
import org.http4k.routing.bind
import org.http4k.routing.routes
import scorcerer.server.log
import scorcerer.server.schedule.ScoreUpdater
import scorcerer.server.services.ReminderService
import scorcerer.server.services.TournamentStateService
import scorcerer.server.services.recalculateAllFixedPoints
import scorcerer.utils.LeaderboardService
import kotlin.concurrent.thread

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

fun adminRoutes(
    leaderboardService: LeaderboardService,
    tournamentStateService: TournamentStateService,
) = requireApiKey.then(
    routes(
        "/admin/update-scores" bind Method.POST to {
            log.info("Admin: update-scores triggered")
            runCatching { ScoreUpdater(leaderboardService, tournamentStateService).run() }
                .onFailure { log.error(it.stackTraceToString()) }
            Response(Status.OK)
        },
        "/admin/recalculate-points" bind Method.POST to {
            log.info("Admin: recalculate-points triggered")
            runCatching { recalculateAllFixedPoints() }
                .onFailure { log.error(it.stackTraceToString()) }
            Response(Status.OK)
        },
        "/admin/send-reminders" bind Method.POST to {
            // Sending reminders for the full opted-in list can take 10+
            // seconds via Resend's API. EventBridge API destinations time out
            // after ~5s and retry on timeout, so we kick the work onto a
            // background thread and return immediately. The idempotency
            // check inside ReminderService (last_reminder_at) protects us
            // against any duplicate triggers that still slip through.
            log.info("Admin: send-reminders triggered, dispatching async")
            thread(name = "send-reminders", isDaemon = true) {
                runCatching { ReminderService.sendReminders() }
                    .onFailure { log.error(it.stackTraceToString()) }
            }
            Response(Status.ACCEPTED)
        },
    ),
)
