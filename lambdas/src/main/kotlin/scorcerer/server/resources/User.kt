package scorcerer.server.resources

import kotlinx.coroutines.runBlocking
import org.http4k.core.Method
import org.http4k.core.RequestContexts
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.path
import org.http4k.routing.routes
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.update
import org.openapitools.server.models.GetUserChips200Response
import org.openapitools.server.models.GetUserPoints200Response
import org.openapitools.server.models.GetUserProfile200Response
import org.openapitools.server.models.League
import org.openapitools.server.models.Prediction
import org.openapitools.server.models.SetSupportedTeamRequest
import org.openapitools.server.models.SignupRequest
import org.openapitools.server.models.UpdateUserProfileRequest
import scorcerer.server.ApiResponseError
import scorcerer.server.auth.AuthProvider
import scorcerer.server.db.tables.LeagueKind
import scorcerer.server.db.tables.LeagueMembershipTable
import scorcerer.server.db.tables.LeagueTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.db.tables.TeamTable
import scorcerer.server.emitCount
import scorcerer.server.extractUserId
import scorcerer.server.fromJson
import scorcerer.server.log
import scorcerer.server.toJson
import scorcerer.utils.LeaderboardService
import scorcerer.utils.capitaliseName
import scorcerer.utils.filterLeaderboardToLeague
import scorcerer.utils.livePointsForUser
import scorcerer.utils.toTitleCase
import scorcerer.utils.toUser

data class OAuthSignupRequest(val userId: String, val email: String, val firstName: String, val familyName: String)

data class OAuthSignupResponse(val idToken: String, val refreshToken: String, val userId: String, val isAdmin: Boolean)

private fun addToGlobalLeague(userId: String) {
    try {
        transaction {
            val globalLeagueExists = LeagueTable.selectAll().where { LeagueTable.id eq "global" }.count() > 0
            if (!globalLeagueExists) {
                LeagueTable.insert {
                    it[name] = "Global"
                    it[id] = "global"
                    it[kind] = LeagueKind.GLOBAL
                }
            }
            LeagueMembershipTable.insert {
                it[memberId] = userId
                it[leagueId] = "global"
            }
        }
    } catch (_: Exception) {
        // Already in global league
    }
}

// Auto-create (if needed) and join the league for the team a user supports.
// League id is the slug of the team name (e.g. "south-africa"); since user
// leagues use UUIDs there's no risk of collision.
private fun addToCountryLeague(userId: String, teamId: Int) {
    try {
        transaction {
            val rawTeamName = TeamTable.select(TeamTable.name).where { TeamTable.id eq teamId }
                .single()[TeamTable.name]
            val leagueId = rawTeamName.lowercase().replace(Regex("\\s+"), "-")
            val leagueName = rawTeamName.toTitleCase()
            val leagueExists = LeagueTable.selectAll().where { LeagueTable.id eq leagueId }.count() > 0
            if (!leagueExists) {
                LeagueTable.insert {
                    it[name] = leagueName
                    it[id] = leagueId
                    it[kind] = LeagueKind.COUNTRY
                }
            }
            LeagueMembershipTable.insert {
                it[memberId] = userId
                it[this.leagueId] = leagueId
            }
        }
    } catch (_: Exception) {
        // League already exists / already a member
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
                        it[firstName] = body.firstName.trim().capitaliseName()
                        it[familyName] = body.familyName.trim().capitaliseName()
                        it[email] = body.email
                        it[fixedPoints] = 0
                        it[MemberTable.authProvider] = "google"
                    }
                }
            } catch (_: Exception) {
                log.info("OAuth member ($userId) already exists (concurrent insert)")
            }
            addToGlobalLeague(userId)
            log.info("Created OAuth member ($userId)")
            emitCount("SignupOAuth")
            runBlocking { leaderboardService.updateGlobalLeaderboard(leaderboardService.getLatestLeaderboardMatchDay()) }
        }
        val tokens = runBlocking { authProvider.generateTokensForOAuth(userId, body.email, body.firstName, body.familyName) }
        val isAdmin = authProvider.isAdmin(body.email)
        Response(Status.OK).body(OAuthSignupResponse(tokens.idToken, tokens.refreshToken, userId, isAdmin).toJson())
    },
    "/user" bind Method.POST to { req ->
        val body: SignupRequest = req.bodyString().fromJson()
        val firstName = body.firstName.trim()
        val familyName = body.familyName.trim()
        if (firstName.isEmpty() || familyName.isEmpty()) {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("First and last name are required"))
        }
        // Browser autofill sometimes drops an email into a name field if the
        // form lacks autocomplete hints. Reject as a defensive check.
        if (firstName.contains("@") || familyName.contains("@")) {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("Names cannot contain '@'"))
        }
        val supportedTeamId = body.supportedTeamId.toIntOrNull()
            ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Invalid supportedTeamId"))

        val existing = transaction {
            MemberTable.selectAll().where { MemberTable.email eq body.email }.firstOrNull()
        }
        if (existing != null) {
            val provider = existing[MemberTable.authProvider]
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("Email already registered via $provider"))
        }

        val teamExists = transaction {
            TeamTable.selectAll().where { TeamTable.id eq supportedTeamId }.count() > 0
        }
        if (!teamExists) {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("Team does not exist"))
        }

        val userId = runBlocking {
            authProvider.signup(body.email, body.password, firstName, familyName, body.emailReminders ?: false, supportedTeamId)
        }
        log.info("Created user ($userId) and set password successfully")

        addToGlobalLeague(userId)
        addToCountryLeague(userId, supportedTeamId)
        log.info("Added to global and country leagues")
        emitCount("SignupCredentials")
        runBlocking { leaderboardService.updateGlobalLeaderboard(leaderboardService.getLatestLeaderboardMatchDay()) }
        Response(Status.OK)
    },
    "/user/supported-team" bind Method.POST to { req ->
        val userId = contexts.extractUserId(req)
        val body: SetSupportedTeamRequest = req.bodyString().fromJson()
        val teamId = body.teamId.toIntOrNull()
            ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Invalid teamId"))
        transaction {
            val member = MemberTable.selectAll().where { MemberTable.id eq userId }.firstOrNull()
                ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("User does not exist"))
            if (member[MemberTable.supportedTeamId] != null) {
                throw ApiResponseError(Response(Status.BAD_REQUEST).body("Supported team already set"))
            }
            val teamExists = TeamTable.selectAll().where { TeamTable.id eq teamId }.count() > 0
            if (!teamExists) {
                throw ApiResponseError(Response(Status.BAD_REQUEST).body("Team does not exist"))
            }
            MemberTable.update({ MemberTable.id eq userId }) {
                it[supportedTeamId] = teamId
            }
        }
        addToCountryLeague(userId, teamId)
        runBlocking { leaderboardService.updateGlobalLeaderboard(leaderboardService.getLatestLeaderboardMatchDay()) }
        Response(Status.OK)
    },
    "/user/leagues" bind Method.GET to { req ->
        val requesterUserId = contexts.extractUserId(req)
        data class LeagueRow(val name: String, val kind: LeagueKind, val userIds: List<String>, val users: List<org.openapitools.server.models.User>)
        val leaguesByMembership: Map<String, LeagueRow> = transaction {
            val userLeagueIds = LeagueMembershipTable
                .select(LeagueMembershipTable.leagueId).where { LeagueMembershipTable.memberId eq requesterUserId }
                .map { it[LeagueMembershipTable.leagueId] }
            (LeagueTable innerJoin LeagueMembershipTable innerJoin MemberTable)
                .join(TeamTable, JoinType.LEFT, MemberTable.supportedTeamId, TeamTable.id)
                .selectAll().where { LeagueTable.id inList userLeagueIds }
                .groupBy { it[LeagueTable.id] }
                .mapValues { entry ->
                    LeagueRow(
                        name = entry.value.first()[LeagueTable.name],
                        kind = entry.value.first()[LeagueTable.kind],
                        userIds = entry.value.map { it[MemberTable.id] },
                        users = entry.value.map { it.toUser() },
                    )
                }
        }

        val globalLeaderboard = runBlocking {
            val matchDay = leaderboardService.getLatestLeaderboardMatchDay()
            leaderboardService.getLeaderboard(matchDay)
        }

        val leagues = leaguesByMembership.map { (leagueId, row) ->
            val yourPosition = if (row.kind == LeagueKind.GLOBAL) {
                globalLeaderboard?.firstOrNull { it.user.userId == requesterUserId }?.position
            } else {
                filterLeaderboardToLeague(globalLeaderboard, row.userIds)
                    .firstOrNull { it.user.userId == requesterUserId }?.position
            }
            League(leagueId, row.name, row.kind.toApiKind(), row.users, yourPosition)
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
            GetUserChips200Response(member[MemberTable.doublePointsChips], member[MemberTable.oneOutChips], member[MemberTable.crowdChips])
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
    "/user/profile" bind Method.GET to { req ->
        val userId = contexts.extractUserId(req)
        val response = transaction {
            val member = MemberTable.selectAll().where { MemberTable.id eq userId }.firstOrNull()
                ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("User does not exist"))
            val teamId = member[MemberTable.supportedTeamId]
            val team = teamId?.let { TeamTable.selectAll().where { TeamTable.id eq it }.firstOrNull() }
            GetUserProfile200Response(
                firstName = member[MemberTable.firstName],
                familyName = member[MemberTable.familyName],
                email = member[MemberTable.email],
                authProvider = member[MemberTable.authProvider],
                emailReminders = member[MemberTable.emailReminders],
                supportedTeamId = teamId?.toString(),
                supportedTeamName = team?.get(TeamTable.name)?.toTitleCase(),
                supportedTeamFlagCode = team?.get(TeamTable.flagCode),
            )
        }
        Response(Status.OK).body(response.toJson())
    },
    "/user/profile" bind Method.PATCH to { req ->
        val userId = contexts.extractUserId(req)
        val body: UpdateUserProfileRequest = req.bodyString().fromJson()

        val newFirstName = body.firstName?.trim()
        val newFamilyName = body.familyName?.trim()
        if (newFirstName?.isEmpty() == true || newFamilyName?.isEmpty() == true) {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("Name cannot be empty"))
        }
        if (newFirstName?.contains("@") == true || newFamilyName?.contains("@") == true) {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("Names cannot contain '@'"))
        }
        val newTeamId = body.supportedTeamId?.toIntOrNull()
        if (body.supportedTeamId != null && newTeamId == null) {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("Invalid supportedTeamId"))
        }

        val (teamChanged, finalTeamId) = transaction {
            val current = MemberTable.selectAll().where { MemberTable.id eq userId }.firstOrNull()
                ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("User does not exist"))
            val previousTeamId = current[MemberTable.supportedTeamId]

            if (newTeamId != null) {
                val teamExists = TeamTable.selectAll().where { TeamTable.id eq newTeamId }.count() > 0
                if (!teamExists) {
                    throw ApiResponseError(Response(Status.BAD_REQUEST).body("Team does not exist"))
                }
            }

            MemberTable.update({ MemberTable.id eq userId }) {
                if (body.emailReminders != null) it[emailReminders] = body.emailReminders
                if (newFirstName != null) it[firstName] = newFirstName.capitaliseName()
                if (newFamilyName != null) it[familyName] = newFamilyName.capitaliseName()
                if (newTeamId != null) it[supportedTeamId] = newTeamId
            }

            // When the team changes, swap the country-league membership.
            if (newTeamId != null && previousTeamId != null && previousTeamId != newTeamId) {
                val previousLeagueId = TeamTable.select(TeamTable.name).where { TeamTable.id eq previousTeamId }
                    .single()[TeamTable.name].lowercase().replace(Regex("\\s+"), "-")
                LeagueMembershipTable.deleteWhere {
                    (LeagueMembershipTable.memberId eq userId).and(LeagueMembershipTable.leagueId eq previousLeagueId)
                }
            }
            Pair(newTeamId != null && previousTeamId != newTeamId, newTeamId)
        }
        if (teamChanged && finalTeamId != null) {
            addToCountryLeague(userId, finalTeamId)
        }
        if (newFirstName != null || newFamilyName != null || teamChanged) {
            runBlocking { leaderboardService.updateGlobalLeaderboard(leaderboardService.getLatestLeaderboardMatchDay()) }
        }
        Response(Status.OK)
    },
)
