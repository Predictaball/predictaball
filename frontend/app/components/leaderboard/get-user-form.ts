import {getConfigWithAuthHeader} from "@/app/api/client-config"
import {ListMatchesFilterTypeEnum, MatchApi} from "@/client"

export async function getUserForm(userId: string): Promise<(number | null)[]> {
    try {
        const matchApi = new MatchApi(await getConfigWithAuthHeader())
        const completed = await matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Completed, userId})
        return completed
            .sort((a, b) => b.datetime.valueOf() - a.datetime.valueOf())
            .slice(0, 5)
            .map(m => m.prediction?.points ?? null)
    } catch {
        return []
    }
}
