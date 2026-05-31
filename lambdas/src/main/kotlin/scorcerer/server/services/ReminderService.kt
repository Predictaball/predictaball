package scorcerer.server.services

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.Match
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.log
import java.time.OffsetDateTime
import java.time.ZoneOffset

object ReminderService {

    private val appBaseUrl: String = System.getenv("APP_BASE_URL") ?: "https://predictaball.live"

    data class UserToRemind(val userId: String, val email: String, val firstName: String)

    fun sendReminders(now: OffsetDateTime = OffsetDateTime.now(ZoneOffset.UTC)) {
        val cutoff = now.plusHours(30)

        val upcomingMatchIds = transaction {
            MatchTable.selectAll().where {
                (MatchTable.state eq Match.State.UPCOMING) and
                    (MatchTable.datetime greaterEq now) and
                    (MatchTable.datetime less cutoff)
            }.map { it[MatchTable.id] }
        }

        if (upcomingMatchIds.isEmpty()) {
            log.info("No upcoming matches in next 24h, skipping reminders")
            return
        }

        val (optedInUsers, predictionsForUpcoming) = transaction {
            val users = MemberTable.selectAll().where { MemberTable.emailReminders eq true }
                .map { UserToRemind(it[MemberTable.id], it[MemberTable.email], it[MemberTable.firstName]) }

            val predictions = if (users.isEmpty()) {
                emptyList()
            } else {
                PredictionTable.selectAll().where {
                    (PredictionTable.matchId inList upcomingMatchIds) and
                        (PredictionTable.memberId inList users.map { it.userId })
                }.map { it[PredictionTable.memberId] to it[PredictionTable.matchId] }
            }

            users to predictions
        }

        if (optedInUsers.isEmpty()) {
            log.info("No users with reminders enabled")
            return
        }

        val predictedByUser: Map<String, Set<Int>> = predictionsForUpcoming
            .groupBy({ it.first }, { it.second })
            .mapValues { it.value.toSet() }

        val upcomingSet = upcomingMatchIds.toSet()
        var sent = 0
        optedInUsers.forEach { user ->
            val predicted = predictedByUser[user.userId] ?: emptySet()
            val unpredictedCount = upcomingSet.count { it !in predicted }
            if (unpredictedCount > 0) {
                EmailService.send(
                    to = user.email,
                    subject = "You have $unpredictedCount match${if (unpredictedCount > 1) "es" else ""} to predict!",
                    html = buildReminderHtml(user.firstName, unpredictedCount),
                )
                sent++
            }
        }

        log.info("Sent $sent reminder emails")
    }

    private fun buildReminderHtml(firstName: String, unpredictedCount: Int): String {
        val plural = if (unpredictedCount > 1) "es" else ""
        return """
            <h2>Hey $firstName!</h2>
            <p>You have <strong>$unpredictedCount</strong> upcoming match$plural without predictions.</p>
            <p><a href="$appBaseUrl/app">Make your predictions now</a></p>
            <hr>
            <p style="font-size: 12px; color: #666;">
                You're receiving this email because you opted in to prediction reminders.
                <a href="$appBaseUrl/app/profile">Unsubscribe</a>.
            </p>
        """.trimIndent()
    }
}
