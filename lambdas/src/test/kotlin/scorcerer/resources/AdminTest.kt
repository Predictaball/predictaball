package scorcerer.resources

import io.kotest.matchers.shouldBe
import io.mockk.coVerify
import io.mockk.mockk
import org.http4k.core.Method
import org.http4k.core.Request
import org.http4k.core.Status
import org.junit.jupiter.api.Test
import scorcerer.DatabaseTest
import scorcerer.server.resources.adminRoutes
import scorcerer.server.services.TournamentStateService
import scorcerer.utils.LeaderboardS3Service

class AdminTest : DatabaseTest() {
    private val mockLeaderboardService = mockk<LeaderboardS3Service>(relaxed = true)
    private val mockTournamentStateService = mockk<TournamentStateService>(relaxed = true)
    private val handler = adminRoutes(mockLeaderboardService, mockTournamentStateService)

    @Test
    fun `rebuild-leaderboard with missing matchDay returns 400`() {
        val response = handler(Request(Method.POST, "/admin/rebuild-leaderboard"))
        response.status shouldBe Status.BAD_REQUEST
    }

    @Test
    fun `rebuild-leaderboard with non-integer matchDay returns 400`() {
        val response = handler(Request(Method.POST, "/admin/rebuild-leaderboard?matchDay=abc"))
        response.status shouldBe Status.BAD_REQUEST
    }

    @Test
    fun `rebuild-leaderboard with valid matchDay calls leaderboard service`() {
        val response = handler(Request(Method.POST, "/admin/rebuild-leaderboard?matchDay=18"))
        response.status shouldBe Status.OK
        coVerify { mockLeaderboardService.updateGlobalLeaderboard(18) }
        coVerify { mockLeaderboardService.updateCountryRankings() }
        coVerify { mockTournamentStateService.invalidateCache() }
    }
}
