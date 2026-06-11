package scorcerer.server

import org.http4k.core.Filter

// Patterns are tried in order — list specific (more-literal) variants before
// templated ones so e.g. /user/profile matches before /user/{userId}/points.
// Requests that don't match any pattern (404s, scanners) are dropped to keep
// the metric namespace's cardinality bounded.
private val ROUTE_PATTERNS = listOf(
    "/ping",
    "/auth/ping",
    "/auth/login",
    "/auth/refresh",
    "/auth/reset",
    "/auth/reset-confirm",
    "/auth/check-email",
    "/admin/update-scores",
    "/admin/recalculate-points",
    "/admin/send-reminders",
    "/tournament/state",
    "/team",
    "/team/name/{teamName}",
    "/team/{teamId}",
    "/prediction",
    "/prediction/{matchId}",
    "/match",
    "/match/list",
    "/match/data/{matchId}",
    "/match/{matchId}/predictions",
    "/match/{matchId}/score",
    "/match/{matchId}/complete",
    "/league",
    "/league/{leagueId}",
    "/league/{leagueId}/preview",
    "/league/{leagueId}/leaderboard",
    "/league/{leagueId}/join",
    "/league/{leagueId}/leave",
    "/user",
    "/user/oauth",
    "/user/profile",
    "/user/leagues",
    "/user/supported-team",
    "/user/{userId}/points",
    "/user/{userId}/chips",
    "/user/{userId}/predictions",
)

private val ROUTE_REGEXES: List<Pair<Regex, String>> = ROUTE_PATTERNS.map { pattern ->
    val regex = "^" + pattern.replace(Regex("\\{[^/]+}"), "[^/]+") + "$"
    Regex(regex) to pattern
}

private fun matchRoute(path: String): String? =
    ROUTE_REGEXES.firstOrNull { it.first.matches(path) }?.second

// Emits one EMF JSON line per request. CloudWatch Logs automatically extracts
// the LatencyMs and RequestCount metrics (namespace Predictaball, dims
// Route/Method/Status) on ingest — no SDK calls or extra IAM needed. Locally
// this just prints to stdout. RequestCount is always 1 so SUM by Status gives
// you error rates alongside latency.
val metricsFilter = Filter { next ->
    { req ->
        val start = System.nanoTime()
        val resp = next(req)
        val durationMs = (System.nanoTime() - start) / 1_000_000.0
        val route = matchRoute(req.uri.path)
        if (route != null) {
            val emf = """{"_aws":{"Timestamp":${System.currentTimeMillis()},"CloudWatchMetrics":[{"Namespace":"Predictaball","Dimensions":[["Route","Method","Status"]],"Metrics":[{"Name":"LatencyMs","Unit":"Milliseconds"},{"Name":"RequestCount","Unit":"Count"}]}]},"Route":"$route","Method":"${req.method}","Status":"${resp.status.code}","LatencyMs":$durationMs,"RequestCount":1}"""
            println(emf)
        }
        resp
    }
}

// Emits a one-shot counter event. Use for things that aren't tied to an HTTP
// route (e.g. signups, auth failures). Same namespace, single dimension `Event`.
fun emitCount(event: String) {
    val emf = """{"_aws":{"Timestamp":${System.currentTimeMillis()},"CloudWatchMetrics":[{"Namespace":"Predictaball","Dimensions":[["Event"]],"Metrics":[{"Name":"Count","Unit":"Count"}]}]},"Event":"$event","Count":1}"""
    println(emf)
}
