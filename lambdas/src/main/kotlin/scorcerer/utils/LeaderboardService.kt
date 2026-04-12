package scorcerer.utils

import org.openapitools.server.models.LeaderboardInner

interface LeaderboardService {
    fun invalidateCache()
    suspend fun writeLeaderboard(leaderboard: List<LeaderboardInner>, matchDay: Int)
    suspend fun getLatestLeaderboardMatchDay(): Int
    suspend fun getLeaderboard(matchDay: Int): List<LeaderboardInner>?
    suspend fun getPreviousLeaderboard(matchDay: Int): List<LeaderboardInner>?
    suspend fun updateGlobalLeaderboard(matchDay: Int)
}
