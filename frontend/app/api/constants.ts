export const API_GATEWAY = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:3000"

// Server-side data-cache window (seconds) for shared, non-personalised reads.
// Only use this for responses that are identical for every user (country
// rankings, tournament state): the data changes only when matches are scored,
// so a short cached window saves an upstream round-trip per request while a
// shared cache stays correct — there's nothing per-user to leak or go stale.
export const SHARED_DATA_REVALIDATE_SECONDS = 60
