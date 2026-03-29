package scorcerer.server.resources

import kotlinx.coroutines.runBlocking
import org.http4k.core.Method
import org.http4k.core.RequestContexts
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.path
import org.http4k.routing.routes
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.CreateLeague200Response
import org.openapitools.server.models.CreateLeagueRequest
import org.openapitools.server.models.GetLeagueLeaderboard200Response
import org.openapitools.server.models.LeaderboardInner
import org.openapitools.server.models.League
import org.openapitools.server.models.User
import org.postgresql.util.PSQLException
import scorcerer.server.ApiResponseError
import scorcerer.server.db.tables.LeagueMembershipTable
import scorcerer.server.db.tables.LeagueTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.extractUserId
import scorcerer.server.fromJson
import scorcerer.server.toJson
import scorcerer.utils.LeaderboardS3Service
import scorcerer.utils.calculateMovement
import scorcerer.utils.filterLeaderboardToLeague
import scorcerer.utils.throwDatabaseError
import kotlin.math.min

fun leagueRoutes(contexts: RequestContexts, leaderboardService: LeaderboardS3Service) = routes(
    "/league" bind Method.POST to { req ->
        val requesterUserId = contexts.extractUserId(req)
        val body: CreateLeagueRequest = req.bodyString().fromJson()
        val id = try {
            transaction {
                LeagueTable.insert {
                    it[name] = body.leagueName
                    it[id] = body.leagueName.trim().lowercase().replace("\\s+".toRegex(), "-").replace("[^a-zA-Z0-9-]".toRegex(), "")
                } get LeagueTable.id
            }
        } catch (e: PSQLException) {
            throwDatabaseError(e, "League already exists")
        }
        transaction {
            LeagueMembershipTable.insert {
                it[memberId] = requesterUserId
                it[leagueId] = id
            }
        }
        Response(Status.OK).body(CreateLeague200Response(id).toJson())
    },
    "/league/{leagueId}" bind Method.GET to { req ->
        val leagueId = req.path("leagueId")!!
        val leagueName = transaction {
            LeagueTable.select(LeagueTable.name).where { LeagueTable.id eq leagueId }.singleOrNull()?.get(LeagueTable.name)
        } ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("League does not exist"))
        val users = transaction {
            (LeagueTable innerJoin LeagueMembershipTable innerJoin MemberTable)
                .select(MemberTable.firstName, MemberTable.familyName, MemberTable.id, MemberTable.fixedPoints, MemberTable.livePoints)
                .where { LeagueTable.id eq leagueId }
                .map { User(it[MemberTable.firstName], it[MemberTable.familyName], it[MemberTable.id], it[MemberTable.fixedPoints], it[MemberTable.livePoints]) }
        }
        Response(Status.OK).body(League(leagueId, leagueName, users).toJson())
    },
    "/league/{leagueId}/leaderboard" bind Method.GET to { req ->
        val leagueId = req.path("leagueId")!!
        val pageSize = req.query("pageSize")
        val page = req.query("page")
        val leagueName = transaction {
            LeagueTable.select(LeagueTable.name).where { LeagueTable.id eq leagueId }.singleOrNull()?.get(LeagueTable.name)
        } ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("League does not exist"))
        val (latestMatchDay, latestGlobalLeaderboard) = runBlocking {
            val matchDay = leaderboardService.getLatestLeaderboardMatchDay()
            val leaderboard = leaderboardService.getLeaderboard(matchDay)
            matchDay to (leaderboard ?: throw ApiResponseError(Response(Status.NOT_FOUND).body("Leaderboard does not exist")))
        }
        val response = if (leagueId == "global") {
            paginateLeaderboard(leagueName, sortLeaderboard(latestGlobalLeaderboard), page, pageSize)
        } else {
            val leagueUserIds = getLeagueUserIds(leagueId)
            val previousGlobalLeaderboard = runBlocking { leaderboardService.getPreviousLeaderboard(latestMatchDay) }
            val filteredLeague = filterLeaderboardToLeague(latestGlobalLeaderboard, leagueUserIds)
            val previousFilteredLeague = filterLeaderboardToLeague(previousGlobalLeaderboard, leagueUserIds)
            paginateLeaderboard(leagueName, sortLeaderboard(calculateMovement(filteredLeague, previousFilteredLeague)), page, pageSize)
        }
        Response(Status.OK).body(response.toJson())
    },
    "/league/{leagueId}/join" bind Method.POST to { req ->
        val requesterUserId = contexts.extractUserId(req)
        val leagueId = req.path("leagueId")!!
        val existing = transaction {
            LeagueMembershipTable.selectAll()
                .where { (LeagueMembershipTable.leagueId eq leagueId) and (LeagueMembershipTable.memberId eq requesterUserId) }
                .singleOrNull()
        }
        if (existing == null) {
            try {
                transaction {
                    LeagueMembershipTable.insert {
                        it[memberId] = requesterUserId
                        it[this.leagueId] = leagueId
                    }
                }
            } catch (e: Exception) {
                throw ApiResponseError(Response(Status.NOT_FOUND).body("League does not exist"))
            }
        }
        Response(Status.OK)
    },
    "/league/{leagueId}/leave" bind Method.POST to { req ->
        val requesterUserId = contexts.extractUserId(req)
        val leagueId = req.path("leagueId")!!
        transaction { LeagueMembershipTable.deleteWhere { (LeagueMembershipTable.leagueId eq leagueId).and(LeagueMembershipTable.memberId eq requesterUserId) } }
        Response(Status.OK)
    },
)

private const val DEFAULT_PAGE_SIZE = "100"
private const val DEFAULT_PAGE = "1"

private fun paginateLeaderboard(leagueName: String, leaderboard: List<LeaderboardInner>, page: String?, pageSize: String?): GetLeagueLeaderboard200Response {
    val pageSizeNum = (pageSize ?: DEFAULT_PAGE_SIZE).toIntOrNull() ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Invalid pageSize"))
    val pageNum = (page ?: DEFAULT_PAGE).toIntOrNull() ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Invalid page"))
    val start = pageSizeNum * (pageNum - 1)
    val end = start + pageSizeNum
    if (start > leaderboard.size) throw ApiResponseError(Response(Status.BAD_REQUEST).body("Page too high"))
    return GetLeagueLeaderboard200Response(leagueName, leaderboard.subList(start, min(end, leaderboard.size)), nextPage = if (end < leaderboard.size) (pageNum + 1).toString() else null)
}

private fun getLeagueUserIds(leagueId: String): List<String> = transaction {
    (LeagueMembershipTable innerJoin MemberTable).select(MemberTable.id).where { LeagueMembershipTable.leagueId eq leagueId }.map { it[MemberTable.id] }
}

private fun sortLeaderboard(leaderboard: List<LeaderboardInner>): List<LeaderboardInner> =
    leaderboard.sortedWith(compareBy<LeaderboardInner> { it.position }.thenBy { it.movement }.thenBy { it.user.familyName }.thenBy { it.user.firstName }.thenBy { it.user.userId })
