package scorcerer.server.schedule

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.Match
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.log
import scorcerer.server.services.getMatchDay
import scorcerer.server.services.setScore
import scorcerer.utils.LeaderboardS3Service
import java.time.Clock
import java.time.OffsetDateTime

class MatchStarter(private val leaderboardService: LeaderboardS3Service) {
    fun run() {
        log.info("Checking for games which have started")

        val now = OffsetDateTime.now(Clock.systemDefaultZone()).plusMinutes(1)
        log.info("Using now - $now")

        transaction {
            val matchesWhichHaveStarted = MatchTable
                .selectAll()
                .where((MatchTable.datetime less now) and (MatchTable.state eq Match.State.UPCOMING))

            log.info("Found ${matchesWhichHaveStarted.count()} games which have already started")

            matchesWhichHaveStarted.forEach {
                val matchId = it[MatchTable.id].toString()
                log.info("Starting match ${it[MatchTable.id]}")

                val matchDay = getMatchDay(matchId)!!
                setScore(matchId, matchDay, 0, 0, leaderboardService)
            }
        }

        log.info("All required matches started")
    }
}
