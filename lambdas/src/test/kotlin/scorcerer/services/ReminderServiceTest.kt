package scorcerer.services

import io.mockk.every
import io.mockk.mockkObject
import io.mockk.unmockkObject
import io.mockk.verify
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import scorcerer.DatabaseTest
import scorcerer.givenMatchExists
import scorcerer.givenPredictionExists
import scorcerer.givenTeamExists
import scorcerer.givenUserExists
import scorcerer.server.services.EmailService
import scorcerer.server.services.ReminderService
import java.time.OffsetDateTime
import java.time.ZoneOffset

class ReminderServiceTest : DatabaseTest() {

    private val now: OffsetDateTime = OffsetDateTime.of(2026, 6, 1, 8, 0, 0, 0, ZoneOffset.UTC)

    @BeforeEach
    fun setupEmailServiceMock() {
        mockkObject(EmailService)
        every { EmailService.send(any(), any(), any()) } returns Unit
    }

    @AfterEach
    fun tearDownEmailServiceMock() {
        unmockkObject(EmailService)
    }

    @Test
    fun sendsRemindersToOptedInUsersWithUnpredictedMatches() {
        val home = givenTeamExists("Home")
        val away = givenTeamExists("Away")
        givenMatchExists(home, away, matchDatetime = now.plusHours(6))
        givenUserExists("user1", "Alice", emailReminders = true)

        ReminderService.sendReminders(now)

        verify(exactly = 1) {
            EmailService.send(
                "user1@test.com",
                match { it.contains("1 match to predict") },
                match { it.contains("Alice") && it.contains("Unsubscribe") },
            )
        }
    }

    @Test
    fun doesNotSendIfNoMatchesInWindow() {
        val home = givenTeamExists("Home")
        val away = givenTeamExists("Away")
        givenMatchExists(home, away, matchDatetime = now.plusDays(3))
        givenUserExists("user1", "Alice", emailReminders = true)

        ReminderService.sendReminders(now)

        verify(exactly = 0) { EmailService.send(any(), any(), any()) }
    }

    @Test
    fun doesNotSendIfMatchAlreadyPassed() {
        val home = givenTeamExists("Home")
        val away = givenTeamExists("Away")
        givenMatchExists(home, away, matchDatetime = now.minusHours(1))
        givenUserExists("user1", "Alice", emailReminders = true)

        ReminderService.sendReminders(now)

        verify(exactly = 0) { EmailService.send(any(), any(), any()) }
    }

    @Test
    fun skipsUsersWhoOptedOut() {
        val home = givenTeamExists("Home")
        val away = givenTeamExists("Away")
        givenMatchExists(home, away, matchDatetime = now.plusHours(6))
        givenUserExists("user1", "Alice", emailReminders = false)

        ReminderService.sendReminders(now)

        verify(exactly = 0) { EmailService.send(any(), any(), any()) }
    }

    @Test
    fun skipsUsersWhoHavePredictedAllUpcomingMatches() {
        val home = givenTeamExists("Home")
        val away = givenTeamExists("Away")
        val matchId = givenMatchExists(home, away, matchDatetime = now.plusHours(6))
        givenUserExists("user1", "Alice", emailReminders = true)
        givenPredictionExists(matchId, "user1", 1, 0)

        ReminderService.sendReminders(now)

        verify(exactly = 0) { EmailService.send(any(), any(), any()) }
    }

    @Test
    fun countsOnlyUnpredictedUpcomingMatches() {
        val home = givenTeamExists("Home")
        val away = givenTeamExists("Away")
        val match1 = givenMatchExists(home, away, matchDatetime = now.plusHours(6))
        givenMatchExists(home, away, matchDatetime = now.plusHours(8))
        givenMatchExists(home, away, matchDatetime = now.plusHours(10))
        givenUserExists("user1", "Alice", emailReminders = true)
        givenPredictionExists(match1, "user1", 1, 0)

        ReminderService.sendReminders(now)

        verify(exactly = 1) {
            EmailService.send(
                "user1@test.com",
                match { it.contains("2 matches to predict") },
                any(),
            )
        }
    }

    @Test
    fun handlesMultipleUsersIndependently() {
        val home = givenTeamExists("Home")
        val away = givenTeamExists("Away")
        val matchId = givenMatchExists(home, away, matchDatetime = now.plusHours(6))
        givenUserExists("alice", "Alice", emailReminders = true)
        givenUserExists("bob", "Bob", emailReminders = true)
        givenUserExists("carol", "Carol", emailReminders = false)
        givenPredictionExists(matchId, "alice", 1, 0)

        ReminderService.sendReminders(now)

        verify(exactly = 0) { EmailService.send("alice@test.com", any(), any()) }
        verify(exactly = 1) { EmailService.send("bob@test.com", any(), any()) }
        verify(exactly = 0) { EmailService.send("carol@test.com", any(), any()) }
    }
}
