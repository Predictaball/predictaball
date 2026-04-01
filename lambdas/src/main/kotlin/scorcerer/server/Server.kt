package scorcerer.server

import aws.sdk.kotlin.services.s3.S3Client
import org.http4k.core.Method
import org.http4k.core.RequestContexts
import org.http4k.core.then
import org.http4k.filter.AllowAll
import org.http4k.filter.CorsPolicy
import org.http4k.filter.OriginPolicy
import org.http4k.filter.ServerFilters.CatchAll
import org.http4k.filter.ServerFilters.Cors
import org.http4k.filter.ServerFilters.InitialiseRequestContext
import org.http4k.routing.routes
import org.http4k.server.Netty
import org.http4k.server.asServer
import scorcerer.server.db.DatabaseFactory
import scorcerer.server.resources.adminRoutes
import scorcerer.server.resources.authRoutes
import scorcerer.server.resources.leagueRoutes
import scorcerer.server.resources.matchRoutes
import scorcerer.server.resources.miscRoutes
import scorcerer.server.resources.predictionRoutes
import scorcerer.server.resources.teamRoutes
import scorcerer.server.resources.userRoutes
import scorcerer.server.schedule.MatchStarter
import scorcerer.server.schedule.ScoreUpdater
import scorcerer.utils.LeaderboardS3Service
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

private val requestContext = RequestContexts()
private val s3Client = S3Client { region = "eu-west-2" }
private val leaderboardService = LeaderboardS3Service(s3Client, Environment.LeaderboardBucketName)

private val allRoutes = routes(
    authRoutes,
    miscRoutes,
    adminRoutes(leaderboardService),
    leagueRoutes(requestContext, leaderboardService),
    matchRoutes(requestContext, leaderboardService),
    predictionRoutes(requestContext),
    teamRoutes(requestContext),
    userRoutes(requestContext),
)

private val cors = Cors(
    CorsPolicy(
        OriginPolicy.AllowAll(),
        listOf(
            "content-type",
            "access-control-allow-origin",
            "access-control-allow-headers",
            "access-control-allow-methods",
            "access-control-allow-credentials",
            "authorization",
        ),
        Method.values().toList(),
        true,
    ),
)

private val authDisabled = System.getenv("AUTH_DISABLED") == "true"
private val schedulerEnabled = System.getenv("SCHEDULER_ENABLED") == "true"

private val httpServer = cors
    .then(InitialiseRequestContext(requestContext))
    .then(loggingFilter)
    .then(CatchAll(::handleError))
    .let { if (authDisabled) it.then(localAuthFilter(requestContext)) else it }
    .then(allRoutes)

fun main() {
    DatabaseFactory.connectAndGenerateTables()

    if (schedulerEnabled) {
        log.info("Starting scheduled tasks")
        val scheduler = Executors.newScheduledThreadPool(1)
        scheduler.scheduleAtFixedRate({ runCatching { MatchStarter(leaderboardService).run() }.onFailure { log.error(it.stackTraceToString()) } }, 0, 60, TimeUnit.MINUTES)
        scheduler.scheduleAtFixedRate({ runCatching { ScoreUpdater(leaderboardService).run() }.onFailure { log.error(it.stackTraceToString()) } }, 0, 2, TimeUnit.MINUTES)
    }

    log.info("Starting server on port 8080 (auth disabled: $authDisabled, scheduler: $schedulerEnabled)")
    httpServer.asServer(Netty(8080)).start().block()
}
