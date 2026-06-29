import React from "react"
import {Toaster} from "react-hot-toast"
import {Match, MatchRoundEnum, MatchStateEnum} from "@/client"
import PredictionPanel from "@/app/components/predictions/prediction-panel"
import {MatchSelectionProvider} from "@/app/components/predictions/match-selection"
import type {UserChips} from "@/app/components/predictions/get-user-chips"
import type {StreakStats} from "@/app/util/streaks"

// Hardcoded preview of the knockout prediction card. The first match has no
// prediction, so it defaults to 0–0 — a draw — which is what surfaces the split
// "who goes through?" submit button. Switch matches in the strip to compare:
//   • England v France  — Round of 16, draw default → split submit button
//   • Brazil v Argentina — Quarter-Final, draw default → split submit button
//   • Spain v Germany    — Round of 16, decisive 2–1 prediction → normal button
//   • Italy v Croatia    — Group Stage, draw default → normal button (no side)
//
// Note: the matchIds are mock, so pressing submit won't persist — this page is
// only for previewing the UI.

const KNOCKOUT_DRAW: Match = {
    homeTeam: "england",
    awayTeam: "france",
    homeTeamFlagCode: "gb-eng",
    awayTeamFlagCode: "fr",
    homeTeamRanking: 4,
    awayTeamRanking: 2,
    venue: "Wembley Stadium, London",
    matchId: "example-ko-draw",
    matchDay: 4,
    datetime: new Date(Date.UTC(2026, 6, 4, 19, 0, 0)),
    round: MatchRoundEnum.RoundOfSixteen,
    state: MatchStateEnum.Upcoming,
}

const KNOCKOUT_DRAW_2: Match = {
    homeTeam: "brazil",
    awayTeam: "argentina",
    homeTeamFlagCode: "br",
    awayTeamFlagCode: "ar",
    homeTeamRanking: 5,
    awayTeamRanking: 1,
    venue: "Estádio do Maracanã, Rio de Janeiro",
    matchId: "example-ko-draw-2",
    matchDay: 5,
    datetime: new Date(Date.UTC(2026, 6, 8, 19, 0, 0)),
    round: MatchRoundEnum.QuarterFinal,
    state: MatchStateEnum.Upcoming,
}

const KNOCKOUT_DECISIVE: Match = {
    homeTeam: "spain",
    awayTeam: "germany",
    homeTeamFlagCode: "es",
    awayTeamFlagCode: "de",
    homeTeamRanking: 8,
    awayTeamRanking: 16,
    venue: "Allianz Arena, Munich",
    matchId: "example-ko-decisive",
    matchDay: 4,
    datetime: new Date(Date.UTC(2026, 6, 5, 19, 0, 0)),
    round: MatchRoundEnum.RoundOfSixteen,
    state: MatchStateEnum.Upcoming,
    prediction: {
        homeScore: 2,
        awayScore: 1,
        chip: "NONE",
        matchId: "example-ko-decisive",
        predictionId: "example-pred-1",
        userId: "example-user",
    },
}

const GROUP_DRAW: Match = {
    homeTeam: "italy",
    awayTeam: "croatia",
    homeTeamFlagCode: "it",
    awayTeamFlagCode: "hr",
    homeTeamRanking: 9,
    awayTeamRanking: 10,
    venue: "Olympiastadion, Berlin",
    matchId: "example-group-draw",
    matchDay: 2,
    datetime: new Date(Date.UTC(2026, 6, 1, 19, 0, 0)),
    round: MatchRoundEnum.GroupStage,
    state: MatchStateEnum.Upcoming,
}

const UPCOMING: Match[] = [KNOCKOUT_DRAW, KNOCKOUT_DRAW_2, KNOCKOUT_DECISIVE, GROUP_DRAW]

const USER_CHIPS: UserChips = {
    doublePointsRemaining: 3,
    oneOutRemaining: 3,
    crowdRemaining: 3,
}

const STREAKS: StreakStats = {
    predictionRate: 0.8,
    predicted: 8,
    played: 10,
    pointsStreak: 3,
}

export default function ExamplePage(): React.JSX.Element {
    return (
        <main className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white">
            <div className="relative w-full max-w-screen-lg mx-auto px-4 sm:px-6 py-10 space-y-6">
                <header className="space-y-1">
                    <h1 className="text-2xl font-bold">Knockout prediction card — preview</h1>
                    <p className="text-sm text-slate-500 dark:text-gray-400">
                        Hardcoded demo. A level score on a knockout match splits the submit button
                        so you can pick which team goes through. Mock data — submissions won&apos;t persist.
                    </p>
                </header>

                <Toaster/>

                <MatchSelectionProvider initialId={KNOCKOUT_DRAW.matchId}>
                    <PredictionPanel
                        liveMatches={[]}
                        upcomingMatches={UPCOMING}
                        completedMatches={[]}
                        historyHref="/app"
                        userChips={USER_CHIPS}
                        streaks={STREAKS}
                    />
                </MatchSelectionProvider>
            </div>
        </main>
    )
}
