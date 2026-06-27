import {Match, MatchRoundEnum, MatchStateEnum} from "@/client"

// Tracks whether the user has already been shown the one-off knockout
// predictions explainer. Stored client-side: the first time someone lands on a
// knockout match they still need to predict, we whisk them through the
// explainer, then never again.
const KNOCKOUT_EXPLAINER_SEEN_KEY = "predictaball:knockout-explainer-seen"

export const KNOCKOUT_EXPLAINER_HREF = "/app/onboarding/knockout-explainer"

export function hasSeenKnockoutExplainer(): boolean {
    if (typeof window === "undefined") return true
    try {
        return window.localStorage.getItem(KNOCKOUT_EXPLAINER_SEEN_KEY) === "true"
    } catch {
        // Private mode / storage disabled: don't trap the user in a redirect loop.
        return true
    }
}

export function markKnockoutExplainerSeen(): void {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(KNOCKOUT_EXPLAINER_SEEN_KEY, "true")
    } catch {
        // No-op: storage unavailable.
    }
}

// A match the user is about to predict for the first time in the knockouts: a
// knockout round, still upcoming, and not yet predicted.
export function needsKnockoutExplainer(match: Match): boolean {
    return match.round !== MatchRoundEnum.GroupStage
        && match.state === MatchStateEnum.Upcoming
        && match.prediction === undefined
}
