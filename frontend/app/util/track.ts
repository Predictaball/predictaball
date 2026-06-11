import { Configuration, MiscApi, TrackingEventEventEnum } from "@/client"
import { API_GATEWAY } from "@/app/api/constants"

const PUBLIC_API = new MiscApi(new Configuration({ basePath: API_GATEWAY }))

// Fire-and-forget — never block the UI on a tracking call. Errors are
// swallowed so a flaky CloudWatch ingest doesn't break the user flow.
export function track(event: TrackingEventEventEnum, fromSignup: boolean): void {
    void PUBLIC_API.trackEvent({ trackingEvent: { event, fromSignup } }).catch(() => {})
}
