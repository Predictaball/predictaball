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
import scorcerer.server.auth.AuthProvider
import scorcerer.server.auth.CognitoAuthProvider
import scorcerer.server.auth.LocalAuthProvider
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
import scorcerer.utils.LeaderboardService
import scorcerer.utils.LocalLeaderboardService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

private enum class AuthMode { LOCAL, COGNITO }
private enum class LeaderboardMode { LOCAL, S3 }
private val authMode = try {
    AuthMode.valueOf(System.getenv("AUTH_MODE")?.uppercase() ?: "COGNITO")
} catch (_: Exception) {
    AuthMode.COGNITO
}
private val leaderboardMode = try {
    LeaderboardMode.valueOf(System.getenv("LEADERBOARD_MODE")?.uppercase() ?: "S3")
} catch (_: Exception) {
    LeaderboardMode.S3
}

private val requestContext = RequestContexts()
private val s3Client by lazy { S3Client { region = "eu-west-2" } }
private val authProvider: AuthProvider = when (authMode) {
    AuthMode.LOCAL -> LocalAuthProvider()
    AuthMode.COGNITO -> CognitoAuthProvider()
}
private val leaderboardService: LeaderboardService = when (leaderboardMode) {
    LeaderboardMode.LOCAL -> LocalLeaderboardService()
    LeaderboardMode.S3 -> LeaderboardS3Service(s3Client, Environment.LeaderboardBucketName)
}

private val allRoutes = routes(
    authRoutes(authProvider),
    miscRoutes,
    adminRoutes(leaderboardService),
    leagueRoutes(requestContext, leaderboardService),
    matchRoutes(requestContext, leaderboardService),
    predictionRoutes(requestContext),
    teamRoutes(requestContext),
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

private val schedulerEnabled = System.getenv("SCHEDULER_ENABLED") == "true"

private val httpServer = cors
    .then(InitialiseRequestContext(requestContext))
    .then(loggingFilter)
    .then(CatchAll(::handleError))
    .let {
        when (authMode) {
            AuthMode.LOCAL -> it.then(localAuthFilter(requestContext))
            AuthMode.COGNITO -> it.then(cognitoAuthFilter(requestContext))
        }
    }
    .then(allRoutes)

fun main() {
    DatabaseFactory.connectAndGenerateTables()

    if (schedulerEnabled) {
        log.info("Starting scheduled tasks")
        val scheduler = Executors.newScheduledThreadPool(1)
        scheduler.scheduleAtFixedRate({ runCatching { MatchStarter(leaderboardService).run() }.onFailure { log.error(it.stackTraceToString()) } }, 0, 15, TimeUnit.MINUTES)
        scheduler.scheduleAtFixedRate({ runCatching { ScoreUpdater(leaderboardService).run() }.onFailure { log.error(it.stackTraceToString()) } }, 0, 2, TimeUnit.MINUTES)
    }

    log.info("Starting server on port 8080 (auth: $authMode, leaderboard: $leaderboardMode, scheduler: $schedulerEnabled)")
    httpServer.asServer(Netty(8080)).start().block()
}
