package scorcerer.resources

import io.kotest.matchers.shouldBe
import org.http4k.core.Method
import org.http4k.core.Request
import org.http4k.core.RequestContexts
import org.http4k.core.Status
import org.http4k.core.then
import org.http4k.filter.ServerFilters.InitialiseRequestContext
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Test
import scorcerer.DatabaseTest
import scorcerer.givenTeamExists
import scorcerer.server.AUTHORIZER_KEY
import scorcerer.server.Authorizer
import scorcerer.server.db.tables.TeamTable
import scorcerer.server.fromJson
import scorcerer.server.resources.teamRoutes

class TeamTest : DatabaseTest() {
    private val contexts = RequestContexts()
    private val handler = testHandler(contexts, teamRoutes(contexts))

    @Test
    fun createTeam() {
        val response = handler(Request(Method.POST, "/team").body("""{"teamName":"England","flagUri":"flag-uri"}"""))
        response.status shouldBe Status.OK
    }

    @Test
    fun createMultipleTeams() {
        handler(Request(Method.POST, "/team").body("""{"teamName":"France","flagUri":"flag-uri"}"""))
        handler(Request(Method.POST, "/team").body("""{"teamName":"Germany","flagUri":"flag-uri"}"""))
        handler(Request(Method.POST, "/team").body("""{"teamName":"Spain","flagUri":"flag-uri"}"""))

        val numberOfTeams = transaction { TeamTable.selectAll().count() }
        numberOfTeams shouldBe 3
    }

    @Test
    fun getTeamWhenTeamExists() {
        val teamId = givenTeamExists("scotland")
        val response = handler(Request(Method.GET, "/team/$teamId"))
        response.status shouldBe Status.OK
        val team: org.openapitools.server.models.Team = response.bodyString().fromJson()
        team.teamName shouldBe "Scotland"
    }

    @Test
    fun getTeamWhenTeamDoesNotExistsRaises() {
        val response = handler(Request(Method.GET, "/team/999"))
        response.status shouldBe Status.BAD_REQUEST
    }

    @Test
    fun getTeamByNameWhenTeamExists() {
        val teamId = givenTeamExists("scotland")
        val response = handler(Request(Method.GET, "/team/name/Scotland"))
        response.status shouldBe Status.OK
        val team: org.openapitools.server.models.Team = response.bodyString().fromJson()
        team.teamId shouldBe teamId
    }

    @Test
    fun getTeamByNameWhenTeamDoesNotExistRaises() {
        val response = handler(Request(Method.GET, "/team/name/nonexistent"))
        response.status shouldBe Status.BAD_REQUEST
    }
}

fun injectTestAuth(contexts: RequestContexts) = org.http4k.core.Filter { next ->
    { req ->
        contexts[req][AUTHORIZER_KEY] = Authorizer(
            claims = mapOf("sub" to "test-user", "custom:isAdmin" to "true"),
            scopes = emptyList(),
        )
        next(req)
    }
}

fun testHandler(contexts: RequestContexts, routes: org.http4k.routing.RoutingHttpHandler) =
    InitialiseRequestContext(contexts)
        .then(org.http4k.filter.ServerFilters.CatchAll { scorcerer.server.handleError(it) })
        .then(injectTestAuth(contexts))
        .then(routes)
