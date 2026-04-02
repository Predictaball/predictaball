import {User} from "../../client/models/User"
import {LeaderboardInner} from "../../client/models/LeaderboardInner"
import {Match, MatchRoundEnum, MatchStateEnum} from "@/client";

export const USER_1: User = {
    firstName: "Tom",
    familyName: "McTomminay",
    userId: "1",
    livePoints: 4,
    fixedPoints: 16
}

export const LEADERBOARD_ENTRY_1: LeaderboardInner = {
    position: 3,
    user: USER_1,
    movement: "WORSENED"
}

export const USER_2: User = {
    firstName: "John",
    familyName: "Smith",
    userId: "2",
    livePoints: 1,
    fixedPoints: 24
}

export const LEADERBOARD_ENTRY_2: LeaderboardInner = {
    position: 2,
    user: USER_2,
    movement: "UNCHANGED"
}

export const USER_3: User = {
    firstName: "Bobby",
    familyName: "Pitch",
    userId: "3",
    livePoints: 0,
    fixedPoints: 26
}

export const LEADERBOARD_ENTRY_3: LeaderboardInner = {
    position: 1,
    user: USER_3,
    movement: "IMPROVED"
}

export const LEADERBOARD: LeaderboardInner[] = [
    LEADERBOARD_ENTRY_3,
    LEADERBOARD_ENTRY_2,
    LEADERBOARD_ENTRY_1
]

export const MATCH: Match = {
    homeTeam: "switzerland",
    awayTeam: "scotland",
    homeTeamFlagCode: "ch",
    awayTeamFlagCode: "gb-sct",
    venue: "Allianz Arena, Munich",
    matchId: "1",
    matchDay: 1,
    datetime: new Date(Date.UTC(2024, 6, 16, 20, 0, 0)),
    round: MatchRoundEnum.GroupStage,
    state: MatchStateEnum.Upcoming,
}