package scorcerer.server

import org.http4k.core.Request
import org.http4k.core.RequestContexts
import org.http4k.core.Response
import org.http4k.core.Status

fun RequestContexts.extractUserId(req: Request): String {
    val authorizer = extract(req).get<Authorizer>(AUTHORIZER_KEY)
    return authorizer?.claims?.get("sub")!!
}

fun RequestContexts.extractIsAdmin(req: Request): Boolean {
    val authorizer = extract(req).get<Authorizer>(AUTHORIZER_KEY)
    return authorizer?.claims?.get("custom:isAdmin")?.toBoolean() ?: false
}

fun requireAdmin(contexts: RequestContexts, req: Request): Response? {
    if (!contexts.extractIsAdmin(req)) {
        return Response(Status.FORBIDDEN).body("Admin privileges are required for this operation.")
    }
    return null
}
