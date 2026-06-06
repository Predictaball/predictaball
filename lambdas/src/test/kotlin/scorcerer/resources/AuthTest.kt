package scorcerer.resources

import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.string.shouldNotBeEmpty
import io.mockk.mockk
import org.http4k.core.Method
import org.http4k.core.Request
import org.http4k.core.RequestContexts
import org.http4k.core.Status
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Test
import scorcerer.DatabaseTest
import scorcerer.givenTeamExists
import scorcerer.server.auth.DatabaseAuthProvider
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.fromJson
import scorcerer.server.resources.CheckEmailResponse
import scorcerer.server.resources.OAuthSignupResponse
import scorcerer.server.resources.authRoutes
import scorcerer.server.resources.userRoutes
import scorcerer.utils.LeaderboardS3Service

class AuthTest : DatabaseTest() {
    private val contexts = RequestContexts()
    private val authProvider = DatabaseAuthProvider()
    private val mockLeaderboardService = mockk<LeaderboardS3Service>(relaxed = true)
    private val userHandler = testHandler(contexts, userRoutes(contexts, mockLeaderboardService, authProvider))
    private val authHandler = testHandler(contexts, authRoutes(authProvider))

    @Test
    fun oauthSignupCreatesMemberWithGoogleProvider() {
        val body = """{"userId":"google_123","email":"test@gmail.com","firstName":"Test","familyName":"User"}"""
        val response = userHandler(Request(Method.POST, "/user/oauth").body(body))
        response.status shouldBe Status.OK
        val result: OAuthSignupResponse = response.bodyString().fromJson()
        result.userId shouldBe "google_123"
        result.idToken.shouldNotBeEmpty()

        val member = transaction { MemberTable.selectAll().where { MemberTable.id eq "google_123" }.first() }
        member[MemberTable.authProvider] shouldBe "google"
        member[MemberTable.email] shouldBe "test@gmail.com"
    }

    @Test
    fun oauthSignupIsIdempotent() {
        val body = """{"userId":"google_123","email":"test@gmail.com","firstName":"Test","familyName":"User"}"""
        userHandler(Request(Method.POST, "/user/oauth").body(body))
        val response = userHandler(Request(Method.POST, "/user/oauth").body(body))
        response.status shouldBe Status.OK

        val count = transaction { MemberTable.selectAll().where { MemberTable.id eq "google_123" }.count() }
        count shouldBe 1
    }

    @Test
    fun oauthSignupAddsToGlobalLeague() {
        val body = """{"userId":"google_456","email":"other@gmail.com","firstName":"Other","familyName":"User"}"""
        userHandler(Request(Method.POST, "/user/oauth").body(body))

        val response = userHandler(Request(Method.GET, "/user/leagues"))
        response.status shouldBe Status.OK
    }

    @Test
    fun emailSignupCreatesMemberWithEmailProvider() {
        val teamId = givenTeamExists("England")
        val body = """{"email":"new@test.com","password":"pass123","firstName":"New","familyName":"User","supportedTeamId":"$teamId"}"""
        val response = userHandler(Request(Method.POST, "/user").body(body))
        response.status shouldBe Status.OK

        val member = transaction {
            MemberTable.selectAll().where { MemberTable.email eq "new@test.com" }.first()
        }
        member[MemberTable.authProvider] shouldBe "email"
    }

    @Test
    fun emailSignupRejectsDuplicateGoogleEmail() {
        val oauthBody = """{"userId":"google_789","email":"taken@gmail.com","firstName":"Google","familyName":"User"}"""
        userHandler(Request(Method.POST, "/user/oauth").body(oauthBody))

        val teamId = givenTeamExists("England")
        val signupBody = """{"email":"taken@gmail.com","password":"pass123","firstName":"Email","familyName":"User","supportedTeamId":"$teamId"}"""
        val response = userHandler(Request(Method.POST, "/user").body(signupBody))
        response.status shouldBe Status.BAD_REQUEST
    }

    @Test
    fun checkEmailReturnsProviderForGoogleUser() {
        val body = """{"userId":"google_abc","email":"google@test.com","firstName":"G","familyName":"User"}"""
        userHandler(Request(Method.POST, "/user/oauth").body(body))

        val response = authHandler(Request(Method.GET, "/auth/check-email?email=google@test.com"))
        response.status shouldBe Status.OK
        val result: CheckEmailResponse = response.bodyString().fromJson()
        result.exists shouldBe true
        result.provider shouldBe "google"
    }

    @Test
    fun checkEmailReturnsProviderForEmailUser() {
        val teamId = givenTeamExists("England")
        val body = """{"email":"email@test.com","password":"pass123","firstName":"E","familyName":"User","supportedTeamId":"$teamId"}"""
        userHandler(Request(Method.POST, "/user").body(body))

        val response = authHandler(Request(Method.GET, "/auth/check-email?email=email@test.com"))
        response.status shouldBe Status.OK
        val result: CheckEmailResponse = response.bodyString().fromJson()
        result.exists shouldBe true
        result.provider shouldBe "email"
    }

    @Test
    fun checkEmailReturnsFalseForUnknownEmail() {
        val response = authHandler(Request(Method.GET, "/auth/check-email?email=nobody@test.com"))
        response.status shouldBe Status.OK
        val result: CheckEmailResponse = response.bodyString().fromJson()
        result.exists shouldBe false
        result.provider shouldBe null
    }

    @Test
    fun loginReturnsUserIdAndToken() {
        val teamId = givenTeamExists("England")
        val signupBody = """{"email":"login@test.com","password":"pass123","firstName":"Login","familyName":"User","supportedTeamId":"$teamId"}"""
        userHandler(Request(Method.POST, "/user").body(signupBody))

        val loginBody = """{"email":"login@test.com","password":"pass123"}"""
        val response = authHandler(Request(Method.POST, "/auth/login").body(loginBody))
        response.status shouldBe Status.OK
        val result: Map<String, Any?> = response.bodyString().fromJson()
        result["userId"] shouldNotBe null
        (result["idToken"] as String).shouldNotBeEmpty()
    }

    @Test
    fun loginRejectsWrongPassword() {
        val teamId = givenTeamExists("England")
        val signupBody = """{"email":"wrong@test.com","password":"pass123","firstName":"Wrong","familyName":"User","supportedTeamId":"$teamId"}"""
        userHandler(Request(Method.POST, "/user").body(signupBody))

        val loginBody = """{"email":"wrong@test.com","password":"wrongpass"}"""
        val response = authHandler(Request(Method.POST, "/auth/login").body(loginBody))
        response.status shouldBe Status.UNAUTHORIZED
    }
}
