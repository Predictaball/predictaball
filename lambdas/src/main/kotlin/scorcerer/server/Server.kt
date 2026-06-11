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
import scorcerer.server.auth.DatabaseAuthProvider
import scorcerer.server.db.DatabaseFactory
import scorcerer.server.resources.adminRoutes
import scorcerer.server.resources.authRoutes
import scorcerer.server.resources.leagueRoutes
import scorcerer.server.resources.matchRoutes
import scorcerer.server.resources.miscRoutes
import scorcerer.server.resources.predictionRoutes
import scorcerer.server.resources.teamRoutes
import scorcerer.server.resources.tournamentRoutes
import scorcerer.server.resources.userRoutes
import scorcerer.server.schedule.ScoreUpdater
import scorcerer.server.services.TournamentStateService
import scorcerer.utils.LeaderboardS3Service
import scorcerer.utils.LeaderboardService
import scorcerer.utils.LocalLeaderboardService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

private val requestContext = RequestContexts()
private val s3Client by lazy { S3Client { region = "eu-west-2" } }
private val authProvider = DatabaseAuthProvider()
private enum class LeaderboardMode { LOCAL, S3 }
private val leaderboardMode = try {
    LeaderboardMode.valueOf(System.getenv("LEADERBOARD_MODE")?.uppercase() ?: "S3")
} catch (_: Exception) {
    LeaderboardMode.S3
}

private val leaderboardService: LeaderboardService = when (leaderboardMode) {
    LeaderboardMode.LOCAL -> LocalLeaderboardService()
    LeaderboardMode.S3 -> LeaderboardS3Service(s3Client, Environment.LeaderboardBucketName)
}

private val tournamentStateService = TournamentStateService()

private val allRoutes = routes(
    authRoutes(authProvider),
    miscRoutes,
    adminRoutes(leaderboardService, tournamentStateService),
    leagueRoutes(requestContext, leaderboardService),
    matchRoutes(requestContext, leaderboardService, tournamentStateService),
    predictionRoutes(requestContext),
    teamRoutes(requestContext),
    tournamentRoutes(tournamentStateService),
    userRoutes(requestContext, leaderboardService, authProvider),
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

private enum class SchedulerMode { IN_PROCESS, OFF }
private val schedulerMode = try {
    SchedulerMode.valueOf(System.getenv("SCHEDULER_MODE")?.uppercase() ?: "OFF")
} catch (_: Exception) {
    SchedulerMode.OFF
}

private val httpServer = cors
    .then(InitialiseRequestContext(requestContext))
    .then(loggingFilter)
    .then(metricsFilter)
    .then(CatchAll(::handleError))
    .then(authFilter(requestContext))
    .then(allRoutes)

fun main() {
    DatabaseFactory.connectAndGenerateTables()

    if (schedulerMode == SchedulerMode.IN_PROCESS) {
        log.info("Starting scheduled tasks")
        val scheduler = Executors.newScheduledThreadPool(1)
        scheduler.scheduleAtFixedRate({ runCatching { ScoreUpdater(leaderboardService, tournamentStateService).run() }.onFailure { log.error(it.stackTraceToString()) } }, 0, 1, TimeUnit.MINUTES)
    }

    log.info("Starting server on port 8080 (leaderboard: $leaderboardMode, scheduler: $schedulerMode)")
    httpServer.asServer(Netty(8080)).start().block()
}
