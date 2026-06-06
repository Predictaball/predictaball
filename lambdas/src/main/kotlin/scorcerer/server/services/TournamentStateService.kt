package scorcerer.server.services

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.GetTournamentState200Response
import org.openapitools.server.models.Match
import scorcerer.server.db.tables.MatchTable

class TournamentStateService {
    private var cached: GetTournamentState200Response? = null
    private var cacheTimestamp: Long = 0
    private val cacheTtlMs = System.getenv("CACHE_TTL_SECONDS")?.toLongOrNull()?.let { it * 1000 } ?: Long.MAX_VALUE

    fun invalidateCache() {
        cached = null
    }

    fun getState(): GetTournamentState200Response {
        val current = cached
        if (current != null && System.currentTimeMillis() - cacheTimestamp < cacheTtlMs) {
            return current
        }
        val computed = compute()
        cached = computed
        cacheTimestamp = System.currentTimeMillis()
        return computed
    }

    private fun compute(): GetTournamentState200Response = transaction {
        val anyLiveOrCompleted = MatchTable.selectAll()
            .where { (MatchTable.state eq Match.State.LIVE) or (MatchTable.state eq Match.State.COMPLETED) }
            .limit(1).count() > 0

        if (!anyLiveOrCompleted) {
            val nextKickoff = MatchTable.selectAll()
                .where { MatchTable.state eq Match.State.UPCOMING }
                .orderBy(MatchTable.datetime)
                .limit(1)
                .firstOrNull()
                ?.get(MatchTable.datetime)
            return@transaction GetTournamentState200Response(
                state = GetTournamentState200Response.State.PRE_TOURNAMENT,
                nextKickoff = nextKickoff,
            )
        }

        val anyUpcomingOrLive = MatchTable.selectAll()
            .where { (MatchTable.state eq Match.State.UPCOMING) or (MatchTable.state eq Match.State.LIVE) }
            .limit(1).count() > 0

        val state = if (anyUpcomingOrLive) {
            GetTournamentState200Response.State.IN_PROGRESS
        } else {
            GetTournamentState200Response.State.COMPLETE
        }
        GetTournamentState200Response(state = state, nextKickoff = null)
    }
}
