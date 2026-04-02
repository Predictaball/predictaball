package scorcerer.integration

import io.kotest.matchers.shouldBe
import io.mockk.coEvery
import io.mockk.mockk
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Test
import org.openapitools.server.models.Match
import scorcerer.givenLeagueExists
import scorcerer.givenMatchExists
import scorcerer.givenPredictionExists
import scorcerer.givenTeamExists
import scorcerer.givenUserExists
import scorcerer.givenUserInLeague
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.services.endMatch
import scorcerer.server.services.setScore
import scorcerer.utils.LeaderboardS3Service
import scorcerer.utils.calculateGlobalLeaderboard
import scorcerer.utils.filterLeaderboardToLeague
import scorcerer.utils.livePointsByUser
import scorcerer.utils.livePointsForUser

class MatchLifecycleTest : PostgresTest() {
    private val leaderboardService = mockk<LeaderboardS3Service> {
        coEvery { updateGlobalLeaderboard(any()) } returns Unit
    }

    @Test
    fun `full match lifecycle from creation to completion with leaderboard`() {
        // Setup: two teams, three users in a global league
        val brazil = givenTeamExists("Brazil")
        val germany = givenTeamExists("Germany")
        givenUserExists("alice", "Alice", "Smith")
        givenUserExists("bob", "Bob", "Jones")
        givenUserExists("charlie", "Charlie", "Brown")
        givenLeagueExists("global", "Global")
        givenUserInLeague("alice", "global")
        givenUserInLeague("bob", "global")
        givenUserInLeague("charlie", "global")

        // Create match and predictions
        val matchId = givenMatchExists(brazil, germany, matchDay = 1)
        givenPredictionExists(matchId, "alice", 2, 1) // will be exact
        givenPredictionExists(matchId, "bob", 1, 0) // will be correct result
        givenPredictionExists(matchId, "charlie", 0, 2) // will be wrong

        // Match goes live at 0-0
        setScore(matchId, 1, 0, 0, leaderboardService)

        // Verify match state
        transaction {
            MatchTable.selectAll().where { MatchTable.id eq matchId.toInt() }
                .first()[MatchTable.state] shouldBe Match.State.LIVE
        }

        // All predictions score 0 at 0-0 (no one predicted a draw)
        transaction { livePointsByUser() }.let { points ->
            points["alice"] shouldBe 0
            points["bob"] shouldBe 0
            points["charlie"] shouldBe 0
        }

        // Goal: 1-0
        setScore(matchId, 1, 1, 0, leaderboardService)
        transaction { livePointsByUser() }.let { points ->
            points["alice"] shouldBe 2 // correct result (home win)
            points["bob"] shouldBe 5 // exact score
            points["charlie"] shouldBe 0
        }

        // Goal: 2-1
        setScore(matchId, 1, 2, 1, leaderboardService)
        transaction { livePointsByUser() }.let { points ->
            points["alice"] shouldBe 5 // exact score
            points["bob"] shouldBe 2 // correct result
            points["charlie"] shouldBe 0
        }

        // Match completes
        endMatch(matchId, 2, 1, leaderboardService)

        // Live points should be empty (no live matches)
        transaction { livePointsByUser() } shouldBe emptyMap()

        // Fixed points should reflect final scores
        transaction {
            MemberTable.selectAll().where { MemberTable.id eq "alice" }.first()[MemberTable.fixedPoints] shouldBe 5
            MemberTable.selectAll().where { MemberTable.id eq "bob" }.first()[MemberTable.fixedPoints] shouldBe 2
            MemberTable.selectAll().where { MemberTable.id eq "charlie" }.first()[MemberTable.fixedPoints] shouldBe 0
        }

        // Leaderboard positions
        val leaderboard = calculateGlobalLeaderboard(null)
        leaderboard[0].user.userId shouldBe "alice"
        leaderboard[0].position shouldBe 1
        leaderboard[1].user.userId shouldBe "bob"
        leaderboard[1].position shouldBe 2
        leaderboard[2].user.userId shouldBe "charlie"
        leaderboard[2].position shouldBe 3
    }

    @Test
    fun `concurrent live matches with one completing while other continues`() {
        val brazil = givenTeamExists("Brazil")
        val germany = givenTeamExists("Germany")
        givenUserExists("alice", "Alice", "Smith")
        givenUserExists("bob", "Bob", "Jones")
        givenLeagueExists("global", "Global")
        givenUserInLeague("alice", "global")
        givenUserInLeague("bob", "global")

        val match1 = givenMatchExists(brazil, germany, matchDay = 1)
        val match2 = givenMatchExists(brazil, germany, matchDay = 1)
        givenPredictionExists(match1, "alice", 1, 0)
        givenPredictionExists(match1, "bob", 0, 1)
        givenPredictionExists(match2, "alice", 2, 2)
        givenPredictionExists(match2, "bob", 3, 0)

        // Both matches go live
        setScore(match1, 1, 1, 0, leaderboardService)
        setScore(match2, 1, 0, 0, leaderboardService)

        // Alice: 5 (exact on match1) + 2 (correct result draw on match2) = 7
        // Bob: 0 (wrong on match1) + 0 (wrong on match2) = 0
        transaction { livePointsForUser("alice") } shouldBe 7
        transaction { livePointsForUser("bob") } shouldBe 0

        // Match 1 completes at 1-0
        endMatch(match1, 1, 0, leaderboardService)

        // Alice: match1 exact (5pts fixed), Bob: match1 wrong (0pts fixed)
        transaction {
            MemberTable.selectAll().where { MemberTable.id eq "alice" }.first()[MemberTable.fixedPoints] shouldBe 5
            MemberTable.selectAll().where { MemberTable.id eq "bob" }.first()[MemberTable.fixedPoints] shouldBe 0
        }

        // Match 2 score changes to 3-0
        setScore(match2, 1, 3, 0, leaderboardService)

        // Match 2 completes at 3-0
        endMatch(match2, 3, 0, leaderboardService)
        val aliceFixed = transaction {
            MemberTable.selectAll().where { MemberTable.id eq "alice" }.first()[MemberTable.fixedPoints]
        }
        val bobFixed = transaction {
            MemberTable.selectAll().where { MemberTable.id eq "bob" }.first()[MemberTable.fixedPoints]
        }
        aliceFixed shouldBe 5 // 5 + 0
        bobFixed shouldBe 5 // 0 + 5

        // Tied on points, leaderboard should have same position
        val leaderboard = calculateGlobalLeaderboard(null)
        leaderboard[0].position shouldBe 1
        leaderboard[1].position shouldBe 1
    }

    @Test
    fun `league leaderboard filters and re-ranks from global`() {
        val brazil = givenTeamExists("Brazil")
        val germany = givenTeamExists("Germany")
        givenUserExists("alice", "Alice", "Smith", fixedPoints = 10)
        givenUserExists("bob", "Bob", "Jones", fixedPoints = 7)
        givenUserExists("charlie", "Charlie", "Brown", fixedPoints = 15)
        givenLeagueExists("global", "Global")
        givenLeagueExists("friends", "Friends")
        givenUserInLeague("alice", "global")
        givenUserInLeague("bob", "global")
        givenUserInLeague("charlie", "global")
        givenUserInLeague("alice", "friends")
        givenUserInLeague("bob", "friends")
        // charlie is NOT in friends league

        val globalLeaderboard = calculateGlobalLeaderboard(null)
        // Global: charlie(15) > alice(10) > bob(7)
        globalLeaderboard[0].user.userId shouldBe "charlie"
        globalLeaderboard[0].position shouldBe 1
        globalLeaderboard[1].user.userId shouldBe "alice"
        globalLeaderboard[1].position shouldBe 2
        globalLeaderboard[2].user.userId shouldBe "bob"
        globalLeaderboard[2].position shouldBe 3

        // Friends league: alice and bob only, re-ranked
        val friendsLeaderboard = filterLeaderboardToLeague(globalLeaderboard, listOf("alice", "bob"))
        friendsLeaderboard[0].user.userId shouldBe "alice"
        friendsLeaderboard[0].position shouldBe 1
        friendsLeaderboard[1].user.userId shouldBe "bob"
        friendsLeaderboard[1].position shouldBe 2
    }

    @Test
    fun `postgres enum handling for match state transitions`() {
        val brazil = givenTeamExists("Brazil")
        val germany = givenTeamExists("Germany")
        val matchId = givenMatchExists(brazil, germany, matchDay = 1)

        // Starts as UPCOMING
        transaction {
            MatchTable.selectAll().where { MatchTable.id eq matchId.toInt() }
                .first()[MatchTable.state] shouldBe Match.State.UPCOMING
        }

        // Goes to LIVE
        setScore(matchId, 1, 0, 0, leaderboardService)
        transaction {
            MatchTable.selectAll().where { MatchTable.id eq matchId.toInt() }
                .first()[MatchTable.state] shouldBe Match.State.LIVE
        }

        // Goes to COMPLETED
        endMatch(matchId, 1, 0, leaderboardService)
        transaction {
            MatchTable.selectAll().where { MatchTable.id eq matchId.toInt() }
                .first()[MatchTable.state] shouldBe Match.State.COMPLETED
        }

        // Can't set score on completed match
        setScore(matchId, 1, 2, 0, leaderboardService)
        // Score should not have changed
        transaction {
            MatchTable.selectAll().where { MatchTable.id eq matchId.toInt() }.first().let {
                it[MatchTable.homeScore] shouldBe 1
                it[MatchTable.awayScore] shouldBe 0
                it[MatchTable.state] shouldBe Match.State.COMPLETED
            }
        }
    }

    @Test
    fun `prediction points persist correctly through score changes`() {
        val brazil = givenTeamExists("Brazil")
        val germany = givenTeamExists("Germany")
        val matchId = givenMatchExists(brazil, germany, matchDay = 1)
        givenUserExists("alice", "Alice")
        val predId = givenPredictionExists(matchId, "alice", 1, 1)

        // 0-0: draw prediction = 2 points (correct result)
        setScore(matchId, 1, 0, 0, leaderboardService)
        transaction {
            PredictionTable.selectAll().where { PredictionTable.id eq predId.toInt() }
                .first()[PredictionTable.points] shouldBe 2
        }

        // 1-0: home win, alice predicted draw = 0 points
        setScore(matchId, 1, 1, 0, leaderboardService)
        transaction {
            PredictionTable.selectAll().where { PredictionTable.id eq predId.toInt() }
                .first()[PredictionTable.points] shouldBe 0
        }

        // 1-1: draw again = 5 points (exact score!)
        setScore(matchId, 1, 1, 1, leaderboardService)
        transaction {
            PredictionTable.selectAll().where { PredictionTable.id eq predId.toInt() }
                .first()[PredictionTable.points] shouldBe 5
        }
    }

    @Test
    fun `user joining league mid-tournament appears at correct position`() {
        givenUserExists("alice", "Alice", "Smith", fixedPoints = 10)
        givenUserExists("bob", "Bob", "Jones", fixedPoints = 5)
        givenUserExists("latejoin", "Late", "Joiner", fixedPoints = 20)
        givenLeagueExists("global", "Global")
        givenLeagueExists("friends", "Friends")
        givenUserInLeague("alice", "global")
        givenUserInLeague("bob", "global")
        givenUserInLeague("latejoin", "global")
        givenUserInLeague("alice", "friends")
        givenUserInLeague("bob", "friends")

        // Friends league before latejoin: alice(10) > bob(5)
        val globalBefore = calculateGlobalLeaderboard(null)
        val friendsBefore = filterLeaderboardToLeague(globalBefore, listOf("alice", "bob"))
        friendsBefore[0].user.userId shouldBe "alice"
        friendsBefore[0].position shouldBe 1
        friendsBefore[1].user.userId shouldBe "bob"
        friendsBefore[1].position shouldBe 2

        // latejoin joins friends league with 20 points, immediately top
        givenUserInLeague("latejoin", "friends")
        val globalAfter = calculateGlobalLeaderboard(null)
        val friendsAfter = filterLeaderboardToLeague(globalAfter, listOf("alice", "bob", "latejoin"))
        friendsAfter[0].user.userId shouldBe "latejoin"
        friendsAfter[0].position shouldBe 1
        friendsAfter[1].user.userId shouldBe "alice"
        friendsAfter[1].position shouldBe 2
        friendsAfter[2].user.userId shouldBe "bob"
        friendsAfter[2].position shouldBe 3
    }

    @Test
    fun `new user joining mid-tournament with zero points goes to bottom`() {
        givenUserExists("alice", "Alice", "Smith", fixedPoints = 10)
        givenUserExists("bob", "Bob", "Jones", fixedPoints = 5)
        givenUserExists("newbie", "New", "Player")
        givenLeagueExists("global", "Global")
        givenUserInLeague("alice", "global")
        givenUserInLeague("bob", "global")
        givenUserInLeague("newbie", "global")

        val leaderboard = calculateGlobalLeaderboard(null)
        leaderboard[0].user.userId shouldBe "alice"
        leaderboard[0].position shouldBe 1
        leaderboard[1].user.userId shouldBe "bob"
        leaderboard[1].position shouldBe 2
        leaderboard[2].user.userId shouldBe "newbie"
        leaderboard[2].position shouldBe 3
    }
}
