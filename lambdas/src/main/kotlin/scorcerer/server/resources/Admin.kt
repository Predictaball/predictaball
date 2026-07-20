package scorcerer.server.resources

import kotlinx.coroutines.runBlocking
import org.http4k.core.Filter
import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.core.then
import org.http4k.routing.bind
import org.http4k.routing.routes
import scorcerer.server.log
import scorcerer.server.schedule.ScoreUpdater
import scorcerer.server.services.EmailService
import scorcerer.server.services.ReminderService
import scorcerer.server.services.TournamentRecapEmail
import scorcerer.server.services.TournamentRecapStats
import scorcerer.server.services.TournamentStateService
import scorcerer.server.services.markRecapSent
import scorcerer.server.services.recalculateAllFixedPoints
import scorcerer.server.toJson
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
        "/admin/rebuild-leaderboard" bind Method.POST to { req ->
            // Rebuilds the S3 leaderboard snapshot for a given match_day from
            // the current state of MemberTable.fixedPoints + live points.
            // Used to recover from a writeLeaderboard that wrote to the wrong
            // matchDay key (e.g. our R32 fixtures briefly collided with
            // group-stage matchdays 4-9). Caller passes ?matchDay=18.
            val matchDay = req.query("matchDay")?.toIntOrNull()
            if (matchDay == null) {
                Response(Status.BAD_REQUEST).body("matchDay query param required")
            } else {
                log.info("Admin: rebuild-leaderboard matchDay=$matchDay triggered")
                runCatching {
                    runBlocking {
                        leaderboardService.updateGlobalLeaderboard(matchDay)
                        leaderboardService.updateCountryRankings()
                    }
                    tournamentStateService.invalidateCache()
                }.onFailure { log.error(it.stackTraceToString()) }
                Response(Status.OK)
            }
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
        "/admin/send-tournament-recap-preview" bind Method.POST to { req ->
            // Renders the tournament-recap email against a hardcoded stats
            // blob and sends to ?to=<email>. Used to iterate on the template
            // design without plumbing real per-user stats through yet. Pass
            // ?stats=ali to swap in Ali's real numbers for his feedback pass.
            val to = req.query("to")
            val statsKey = req.query("stats")?.lowercase() ?: "fake"
            if (to.isNullOrBlank()) {
                Response(Status.BAD_REQUEST).body("`to` query param required")
            } else {
                log.info("Admin: send-tournament-recap-preview to=$to stats=$statsKey")
                runCatching {
                    val stats = when (statsKey) {
                        "ali" -> TournamentRecapEmail.ALI_STATS
                        else -> TournamentRecapEmail.FAKE_STATS
                    }
                    val html = TournamentRecapEmail.render(stats)
                    // Wrap-up email goes out from a person-shaped address so
                    // recipients can reply with feedback. improvmx forwards
                    // luke@predictaball.live to Luke's inbox.
                    EmailService.send(
                        to,
                        TournamentRecapEmail.subject(stats),
                        html,
                        from = "Luke at Predictaball <luke@predictaball.live>",
                    )
                }.onFailure { log.error(it.stackTraceToString()) }
                Response(Status.OK)
            }
        },
        "/admin/preview-tournament-recap" bind Method.GET to {
            // Returns the rendered HTML directly so the template can be
            // iterated in a browser tab (no Resend, no inbox involved).
            val html = TournamentRecapEmail.render(TournamentRecapEmail.FAKE_STATS)
            Response(Status.OK).header("Content-Type", "text/html; charset=utf-8").body(html)
        },
        "/admin/send-tournament-recap" bind Method.POST to { req ->
            // Sends the end-of-tournament recap to eligible users using real
            // per-user stats from the DB. Idempotent: skips anyone whose
            // recap_sent_at is already set. Marks each recipient in the same
            // request they were sent to so a partial failure part-way
            // through only re-sends to those who hadn't been reached.
            //
            // Params:
            //   dryRun=true|false     — logs recipients, doesn't send. Default false.
            //   to=<email>            — restrict to a single email address (prod smoke test).
            //   threshold=<int>       — override the min prediction count. Default 10.
            val dryRun = req.query("dryRun") == "true"
            val to = req.query("to")
            val threshold = req.query("threshold")?.toIntOrNull() ?: 10

            log.info("Admin: send-tournament-recap dryRun=$dryRun to=$to threshold=$threshold")

            val result = runCatching {
                val shared = TournamentRecapStats.computeShared()
                val eligible = TournamentRecapStats.eligibleRecipients(shared, threshold)
                val recipients = if (to.isNullOrBlank()) eligible else eligible.filter { it.email == to }

                var sent = 0
                var failed = 0
                for (member in recipients) {
                    if (dryRun) {
                        log.info("dryRun: would send to ${member.email} (id=${member.id})")
                        continue
                    }
                    try {
                        val stats = TournamentRecapStats.computeFor(member.id, shared)
                        val html = TournamentRecapEmail.render(stats)
                        EmailService.send(
                            member.email,
                            TournamentRecapEmail.subject(stats),
                            html,
                            from = "Luke at Predictaball <luke@predictaball.live>",
                        )
                        markRecapSent(member.id)
                        sent++
                        // Stay well under Resend's per-second limit even if
                        // it tightens in future.
                        Thread.sleep(300)
                    } catch (e: Exception) {
                        log.error("recap send to ${member.email} failed: ${e.message}")
                        failed++
                    }
                }
                mapOf(
                    "eligible" to eligible.size,
                    "matchedFilter" to recipients.size,
                    "sent" to sent,
                    "failed" to failed,
                    "dryRun" to dryRun,
                )
            }
            result.fold(
                onSuccess = { Response(Status.OK).body(it.toJson()) },
                onFailure = {
                    log.error(it.stackTraceToString())
                    Response(Status.INTERNAL_SERVER_ERROR).body("send failed: ${it.message}")
                },
            )
        },
    ),
)
