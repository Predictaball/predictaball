package scorcerer.server.resources

import org.http4k.core.Method
import org.http4k.core.RequestContexts
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.path
import org.http4k.routing.routes
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.CreateTeam200Response
import org.openapitools.server.models.CreateTeamRequest
import org.openapitools.server.models.Team
import scorcerer.server.ApiResponseError
import scorcerer.server.db.tables.TeamTable
import scorcerer.server.extractUserId
import scorcerer.server.fromJson
import scorcerer.server.requireAdmin
import scorcerer.server.toJson
import scorcerer.utils.toTitleCase

fun teamRoutes(contexts: RequestContexts) = routes(
    "/team" bind Method.POST to { req ->
        requireAdmin(contexts, req) ?: run {
            val requesterUserId = contexts.extractUserId(req)
            val body: CreateTeamRequest = req.bodyString().fromJson()
            val id = transaction {
                TeamTable.insert {
                    it[name] = body.teamName.lowercase()
                    it[flagCode] = body.flagCode
                } get TeamTable.id
            }
            Response(Status.OK).body(CreateTeam200Response(id.toString()).toJson())
        }
    },
    "/team/{teamId}" bind Method.GET to { req ->
        val teamId = req.path("teamId")!!
        val team = transaction {
            TeamTable.selectAll().where { TeamTable.id eq teamId.toInt() }.firstOrNull()
                ?.let { row -> Team(row[TeamTable.id].toString(), row[TeamTable.name].toTitleCase(), row[TeamTable.flagCode]) }
                ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Team does not exist"))
        }
        Response(Status.OK).body(team.toJson())
    },
    "/team/name/{teamName}" bind Method.GET to { req ->
        val teamName = req.path("teamName")!!
        val team = transaction {
            TeamTable.selectAll().where { TeamTable.name eq teamName.lowercase() }.firstOrNull()
                ?.let { row -> Team(row[TeamTable.id].toString(), row[TeamTable.name].toTitleCase(), row[TeamTable.flagCode]) }
                ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Team does not exist"))
        }
        Response(Status.OK).body(team.toJson())
    },
)
