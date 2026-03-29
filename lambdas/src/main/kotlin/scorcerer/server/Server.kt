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
import org.http4k.server.Netty
import org.http4k.server.asServer
import org.openapitools.server.apis.allRoutes
import scorcerer.server.db.Database
import scorcerer.server.resources.Auth
import scorcerer.server.resources.League
import scorcerer.server.resources.MatchResource
import scorcerer.server.resources.Misc
import scorcerer.server.resources.Prediction
import scorcerer.server.resources.Team
import scorcerer.server.resources.User
import scorcerer.utils.LeaderboardS3Service

private val requestContext = RequestContexts()
private val s3Client = S3Client { region = "eu-west-2" }
private val leaderboardService = LeaderboardS3Service(s3Client, Environment.LeaderboardBucketName)

private val routes = allRoutes(
    Auth(requestContext),
    League(requestContext, leaderboardService),
    MatchResource(requestContext, leaderboardService),
    Misc(requestContext),
    Prediction(requestContext),
    Team(requestContext),
    User(requestContext),
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

private val httpServer = cors
    .then(InitialiseRequestContext(requestContext))
    .then(loggingFilter)
    .then(CatchAll(::handleError))
    .let { if (authDisabled) it.then(localAuthFilter(requestContext)) else it }
    .then(routes)

fun main() {
    Database.connectAndGenerateTables()
    log.info("Starting server on port 8080 (auth disabled: $authDisabled)")
    httpServer.asServer(Netty(8080)).start().block()
}
