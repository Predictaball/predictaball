package scorcerer.server.services

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.Match
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.log
import java.time.OffsetDateTime

object ReminderService {

    fun sendReminders() {
        val now = OffsetDateTime.now()
        val tomorrow = now.plusHours(24)

        val upcomingMatchIds = transaction {
            MatchTable.selectAll().where {
                (MatchTable.state eq Match.State.UPCOMING) and
                    (MatchTable.datetime less tomorrow)
            }.map { it[MatchTable.id] }
        }

        if (upcomingMatchIds.isEmpty()) {
            log.info("No upcoming matches in next 24h, skipping reminders")
            return
        }

        val usersWithReminders = transaction {
            MemberTable.selectAll().where { MemberTable.emailReminders eq true }
                .map { Triple(it[MemberTable.id], it[MemberTable.email], it[MemberTable.firstName]) }
        }

        if (usersWithReminders.isEmpty()) {
            log.info("No users with reminders enabled")
            return
        }

        var sent = 0
        usersWithReminders.forEach { (userId, email, firstName) ->
            val predictedMatchIds = transaction {
                PredictionTable.selectAll().where { PredictionTable.memberId eq userId }
                    .map { it[PredictionTable.matchId] }
                    .toSet()
            }

            val unpredictedCount = upcomingMatchIds.count { it !in predictedMatchIds }
            if (unpredictedCount > 0) {
                EmailService.send(
                    to = email,
                    subject = "You have $unpredictedCount match${if (unpredictedCount > 1) "es" else ""} to predict!",
                    html = "<h2>Hey $firstName!</h2>" +
                        "<p>You have <strong>$unpredictedCount</strong> upcoming match${if (unpredictedCount > 1) "es" else ""} without predictions.</p>" +
                        "<p><a href=\"https://predictaball.live/app\">Make your predictions now</a></p>" +
                        "<hr><p style=\"font-size: 12px; color: #666;\">Don't want these emails? <a href=\"https://predictaball.live/app/profile\">Manage your preferences</a></p>",
                )
                sent++
            }
        }

        log.info("Sent $sent reminder emails")
    }
}
