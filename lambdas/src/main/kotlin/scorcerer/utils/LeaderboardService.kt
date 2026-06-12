package scorcerer.utils

import org.openapitools.server.models.CountryLeaderboardInner
import org.openapitools.server.models.LeaderboardInner

interface LeaderboardService {
    fun invalidateCache()
    suspend fun writeLeaderboard(leaderboard: List<LeaderboardInner>, matchDay: Int)
    suspend fun getLatestLeaderboardMatchDay(): Int
    suspend fun getLeaderboard(matchDay: Int): List<LeaderboardInner>?
    suspend fun getPreviousLeaderboard(matchDay: Int): List<LeaderboardInner>?
    suspend fun updateGlobalLeaderboard(matchDay: Int)

    // Country rankings are a single current snapshot (not keyed by match day). They are
    // recomputed when scores change and served from cache, like the global leaderboard.
    suspend fun writeCountryRankings(rankings: List<CountryLeaderboardInner>)
    suspend fun getCountryRankings(): List<CountryLeaderboardInner>?
    suspend fun updateCountryRankings()
}
