import {Configuration, LeagueApi} from "@/client";

export async function getPositionForLeague(
    leagueId: string,
    config: Configuration,
    userId: string | undefined
): Promise<number> {
    if (userId === undefined) {
        return 0
    }

    try {
        const leagueClient = new LeagueApi(config)
        const league = await leagueClient.getLeagueLeaderboard({ leagueId: leagueId, pageSize: "200" })
        const position = league
            .leaderboard
            .find(entry => entry.user.userId === userId)
            ?.position
        return position === undefined ? 0 : position
    } catch (error) {
        console.log(error)
        return 0
    }
}