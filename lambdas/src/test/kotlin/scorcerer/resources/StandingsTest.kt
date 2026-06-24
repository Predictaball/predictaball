package scorcerer.resources

import io.kotest.matchers.shouldBe
import org.http4k.core.Method
import org.http4k.core.Request
import org.http4k.core.RequestContexts
import org.http4k.core.Status
import org.junit.jupiter.api.Test
import org.openapitools.server.models.Match
import org.openapitools.server.models.Standings
import scorcerer.DatabaseTest
import scorcerer.givenMatchExists
import scorcerer.givenTeamExists
import scorcerer.server.fromJson
import scorcerer.server.resources.PlayedMatch
import scorcerer.server.resources.StandingsTeam
import scorcerer.server.resources.computeStandings
import scorcerer.server.resources.standingsRoutes

class StandingsComputationTest {
    private fun team(id: Int, group: String = "A", ranking: Int? = null) =
        StandingsTeam(id, "Team $id", "fl", group, ranking)

    private fun match(home: Int, away: Int, homeScore: Int, awayScore: Int) =
        PlayedMatch(home, away, homeScore, awayScore)

    @Test
    fun ordersByPointsThenGoalDifference() {
        val teams = listOf(team(1), team(2), team(3), team(4))
        // 1 beats 2 and 3; 3 beats 4; 2 beats 4 with a big margin.
        // Points: team1=6, team2=3, team3=3, team4=0.
        val matches = listOf(
            match(1, 2, 3, 0),
            match(1, 3, 1, 0),
            match(4, 3, 0, 2),
            match(2, 4, 5, 0),
        )
        val group = computeStandings(teams, matches).groups.single { it.group == "A" }.standings

        group.map { it.teamId } shouldBe listOf("1", "2", "3", "4")
        group.map { it.position } shouldBe listOf(1, 2, 3, 4)
        group[0].points shouldBe 6
        // team2 and team3 both on 3 points; team2 has GD +2 (5-3), team3 has GD +1 (2-2) -> overall GD breaks it
        group[1].teamId shouldBe "2"
        group[2].teamId shouldBe "3"
    }

    @Test
    fun headToHeadBeatsOverallGoalDifference() {
        // team1 and team2 both end on 6 points. team2 has a much better overall GD,
        // but team1 won the head-to-head, so team1 must rank above team2.
        val teams = listOf(team(1), team(2), team(3), team(4))
        // team1 beats team2 head-to-head and beats team3.
        // team2 thrashes team4 (huge GD) and beats team3.
        // team1: 6 pts, GD +2. team2: 6 pts, GD +7. H2H: team1 won -> team1 first.
        val matches = listOf(
            match(1, 2, 1, 0),
            match(1, 3, 1, 0),
            match(2, 4, 7, 0),
            match(2, 3, 1, 0),
        )
        val group = computeStandings(teams, matches).groups.single { it.group == "A" }.standings
        group[0].teamId shouldBe "1"
        group[1].teamId shouldBe "2"
    }

    @Test
    fun fallsThroughToFifaRankingWhenAllElseEqual() {
        // Two teams identical in every on-pitch metric (they drew each other and
        // have identical records) -> FIFA ranking decides. Lower number = better.
        val teams = listOf(team(1, ranking = 10), team(2, ranking = 5))
        // A draw leaves equal points, equal h2h, equal GD and equal goals.
        val matches = listOf(
            match(1, 2, 1, 1),
        )
        val group = computeStandings(teams, matches).groups.single { it.group == "A" }.standings
        group[0].teamId shouldBe "2" // ranking 5 beats ranking 10
        group[1].teamId shouldBe "1"
    }

    @Test
    fun thirdPlacedTableRanksThirdPlacedTeamsAcrossGroups() {
        // Group A and Group B, each with 4 teams. We only care that the 3rd-placed
        // team of each group is collected and ranked against each other.
        val teams = listOf(
            team(1, "A"),
            team(2, "A"),
            team(3, "A"),
            team(4, "A"),
            team(5, "B"),
            team(6, "B"),
            team(7, "B"),
            team(8, "B"),
        )
        val matches = listOf(
            // Group A: 1>2>3>4. Third place = team3 with 3 points.
            match(1, 2, 1, 0), match(1, 3, 1, 0), match(1, 4, 1, 0),
            match(2, 3, 1, 0), match(2, 4, 1, 0), match(3, 4, 1, 0),
            // Group B: 5 wins all, 6 beats 7 and 8, and 8 beats 7 5-1. So the
            // third-placed team is team8 (3 pts) with a much worse goal difference.
            match(5, 6, 5, 0), match(5, 7, 5, 0), match(5, 8, 5, 0),
            match(6, 7, 5, 0), match(6, 8, 5, 0), match(7, 8, 1, 5),
        )
        val standings = computeStandings(teams, matches)
        val thirdPlaced = standings.thirdPlaced
        thirdPlaced.map { it.teamId }.toSet() shouldBe setOf("3", "8")
        // team3: 3 pts GD -1. team8: 3 pts GD -10 -> team3 ranks above team8.
        thirdPlaced[0].teamId shouldBe "3"
        thirdPlaced[0].position shouldBe 1
        thirdPlaced[1].position shouldBe 2
    }

    @Test
    fun groupsAreReturnedInAlphabeticalOrder() {
        val teams = listOf(team(1, "C"), team(2, "A"), team(3, "B"))
        val groups = computeStandings(teams, emptyList()).groups
        groups.map { it.group } shouldBe listOf("A", "B", "C")
    }
}

class StandingsRouteTest : DatabaseTest() {
    private val contexts = RequestContexts()
    private val handler = testHandler(contexts, standingsRoutes())

    @Test
    fun returnsStandingsForGroupsWithScoredMatches() {
        val home = givenTeamExists("england", "A")
        val away = givenTeamExists("france", "A")
        givenTeamExists("spain", "B")
        givenMatchExists(home, away, matchState = Match.State.COMPLETED, homeScore = 2, awayScore = 1)

        val response = handler(Request(Method.GET, "/standings"))
        response.status shouldBe Status.OK
        val standings: Standings = response.bodyString().fromJson()

        val groupA = standings.groups.single { it.group == "A" }.standings
        groupA[0].teamName shouldBe "England"
        groupA[0].points shouldBe 3
        groupA[0].played shouldBe 1
        groupA[1].teamName shouldBe "France"
        groupA[1].points shouldBe 0
    }
}
