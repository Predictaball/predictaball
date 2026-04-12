package scorcerer.utils

import org.openapitools.server.models.LeaderboardInner
import scorcerer.server.log

class LocalLeaderboardService : LeaderboardService {
    private val store = mutableMapOf<Int, List<LeaderboardInner>>()

    override fun invalidateCache() {}

    override suspend fun writeLeaderboard(leaderboard: List<LeaderboardInner>, matchDay: Int) {
        store[matchDay] = leaderboard
        log.info("Local leaderboard written for matchDay $matchDay (${leaderboard.size} entries)")
    }

    override suspend fun getLatestLeaderboardMatchDay(): Int {
        return store.keys.maxOrNull() ?: 0
    }

    override suspend fun getLeaderboard(matchDay: Int): List<LeaderboardInner>? {
        return store[matchDay]
    }

    override suspend fun getPreviousLeaderboard(matchDay: Int): List<LeaderboardInner>? {
        return store[matchDay - 1]
    }

    override suspend fun updateGlobalLeaderboard(matchDay: Int) {
        val leaderboard = calculateGlobalLeaderboard(store[matchDay])
        writeLeaderboard(leaderboard, matchDay)
    }
}
