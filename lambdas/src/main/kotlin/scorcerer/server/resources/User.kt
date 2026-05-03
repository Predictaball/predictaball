package scorcerer.server.resources

import kotlinx.coroutines.runBlocking
import org.http4k.core.Method
import org.http4k.core.RequestContexts
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.path
import org.http4k.routing.routes
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.GetUserChips200Response
import org.openapitools.server.models.GetUserPoints200Response
import org.openapitools.server.models.League
import org.openapitools.server.models.Prediction
import org.openapitools.server.models.SignupRequest
import org.openapitools.server.models.User
import scorcerer.server.ApiResponseError
import scorcerer.server.auth.AuthProvider
import scorcerer.server.db.tables.LeagueMembershipTable
import scorcerer.server.db.tables.LeagueTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.extractUserId
import scorcerer.server.fromJson
import scorcerer.server.log
import scorcerer.server.toJson
import scorcerer.utils.LeaderboardService
import scorcerer.utils.livePointsForUser

data class OAuthSignupRequest(val userId: String, val email: String, val firstName: String, val familyName: String)

data class OAuthSignupResponse(val idToken: String, val refreshToken: String, val userId: String, val isAdmin: Boolean)

private fun addToGlobalLeague(userId: String) {
    transaction {
        val globalLeagueExists = LeagueTable.selectAll().where { LeagueTable.id eq "global" }.count() > 0
        if (!globalLeagueExists) {
            LeagueTable.insert {
                it[name] = "Global"
                it[id] = "global"
            }
        }
        LeagueMembershipTable.insert {
            it[memberId] = userId
            it[leagueId] = "global"
        }
    }
}

private val adminApiKey = System.getenv("ADMIN_API_KEY")

fun userRoutes(contexts: RequestContexts, leaderboardService: LeaderboardService, authProvider: AuthProvider) = routes(
    "/user/oauth" bind Method.POST to { req ->
        if (adminApiKey != null && req.header("X-Api-Key") != adminApiKey) {
            throw ApiResponseError(Response(Status.UNAUTHORIZED).body("Invalid API key"))
        }
        val body: OAuthSignupRequest = req.bodyString().fromJson()
        val userId = body.userId
        val existing = transaction {
            MemberTable.selectAll().where { MemberTable.id eq userId }.count() > 0
        }
        if (!existing) {
            try {
                transaction {
                    MemberTable.insert {
                        it[id] = userId
                        it[firstName] = body.firstName.trim()
                        it[familyName] = body.familyName.trim()
                        it[email] = body.email
                        it[fixedPoints] = 0
                        it[MemberTable.authProvider] = "google"
                    }
                }
                addToGlobalLeague(userId)
                log.info("Created OAuth member ($userId)")
                runBlocking { leaderboardService.updateGlobalLeaderboard(leaderboardService.getLatestLeaderboardMatchDay()) }
            } catch (_: Exception) {
                log.info("OAuth member ($userId) already exists (concurrent insert)")
            }
        }
        val tokens = runBlocking { authProvider.generateTokensForOAuth(userId, body.email, body.firstName, body.familyName) }
        val isAdmin = authProvider.isAdmin(body.email)
        Response(Status.OK).body(OAuthSignupResponse(tokens.idToken, tokens.refreshToken, userId, isAdmin).toJson())
    },
    "/user" bind Method.POST to { req ->
        val body: SignupRequest = req.bodyString().fromJson()
        val firstName = body.firstName.trim()
        val familyName = body.familyName.trim()

        val existing = transaction {
            MemberTable.selectAll().where { MemberTable.email eq body.email }.firstOrNull()
        }
        if (existing != null) {
            val provider = existing[MemberTable.authProvider]
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("Email already registered via $provider"))
        }

        val userId = runBlocking {
            authProvider.signup(body.email, body.password, firstName, familyName)
        }
        log.info("Created user ($userId) and set password successfully")

        addToGlobalLeague(userId)
        log.info("Added to global league")
        runBlocking { leaderboardService.updateGlobalLeaderboard(leaderboardService.getLatestLeaderboardMatchDay()) }
        Response(Status.OK)
    },
    "/user/leagues" bind Method.GET to { req ->
        val requesterUserId = contexts.extractUserId(req)
        val leagues = transaction {
            val userLeagueIds = LeagueMembershipTable
                .select(LeagueMembershipTable.leagueId).where { LeagueMembershipTable.memberId eq requesterUserId }
                .map { it[LeagueMembershipTable.leagueId] }
            (LeagueTable innerJoin LeagueMembershipTable innerJoin MemberTable)
                .selectAll().where { LeagueTable.id inList userLeagueIds }
                .groupBy { it[LeagueTable.id] }
                .mapValues { entry ->
                    val leagueName = entry.value.first()[LeagueTable.name]
                    val users = entry.value.map { User(it[MemberTable.firstName], it[MemberTable.familyName], it[MemberTable.id], it[MemberTable.doublePointsChips], it[MemberTable.oneOutChips], it[MemberTable.fixedPoints], 0) }
                    League(entry.key, leagueName, users)
                }.values.toList()
        }
        Response(Status.OK).body(leagues.toJson())
    },
    "/user/{userId}/points" bind Method.GET to { req ->
        val userId = req.path("userId")!!
        val points = transaction {
            val member = MemberTable.selectAll().where { MemberTable.id eq userId }.firstOrNull()
                ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("User does not exist"))
            val livePoints = livePointsForUser(userId)
            GetUserPoints200Response(member[MemberTable.fixedPoints], livePoints)
        }
        Response(Status.OK).body(points.toJson())
    },
    "/user/{userId}/chips" bind Method.GET to { req ->
        val userId = req.path("userId")!!
        val chips = transaction {
            val member = MemberTable.selectAll().where { MemberTable.id eq userId }.firstOrNull()
                ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("User does not exist"))
            GetUserChips200Response(member[MemberTable.doublePointsChips], member[MemberTable.oneOutChips])
        }
        Response(Status.OK).body(chips.toJson())
    },
    "/user/{userId}/predictions" bind Method.GET to { req ->
        val userId = req.path("userId")!!
        val predictions = transaction {
            PredictionTable.selectAll().where { PredictionTable.memberId eq userId }.map { row ->
                Prediction(row[PredictionTable.homeScore], row[PredictionTable.chip], row[PredictionTable.awayScore], row[PredictionTable.matchId].toString(), row[PredictionTable.id].toString(), row[PredictionTable.memberId], row[PredictionTable.points])
            }
        }
        Response(Status.OK).body(predictions.toJson())
    },
)
