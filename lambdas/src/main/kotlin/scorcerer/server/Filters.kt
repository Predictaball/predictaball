package scorcerer.server

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.fasterxml.jackson.core.JacksonException
import org.http4k.core.Filter
import org.http4k.core.RequestContexts
import org.http4k.core.Response
import org.http4k.core.Status

val loggingFilter = Filter { next ->
    { req ->
        next(req).also { log.info("${req.method} ${req.uri} ${it.status}") }
    }
}

fun authFilter(requestContext: RequestContexts) = Filter { next ->
    { req ->
        val token = req.header("Authorization")?.removePrefix("Bearer ")
        if (token.isNullOrBlank()) {
            next(req)
        } else {
            try {
                val verifier = JWT.require(Algorithm.HMAC256(scorcerer.server.auth.DatabaseAuthProvider.SECRET)).build()
                val verified = verifier.verify(token)
                requestContext[req][AUTHORIZER_KEY] = Authorizer(
                    claims = verified.claims.mapValues { it.value.asString() ?: "" },
                    scopes = emptyList(),
                )
            } catch (e: Exception) {
                log.error("JWT verification failed: ${e.message}")
                emitCount("AuthFailure")
            }
            next(req)
        }
    }
}

fun handleError(e: Throwable): Response =
    when (e) {
        is ApiResponseError -> e.response
        is JacksonException -> {
            log.error(e.stackTraceToString())
            Response(Status.BAD_REQUEST).body(e.message.toString())
        }
        else -> {
            log.error(e.stackTraceToString())
            Response(Status.INTERNAL_SERVER_ERROR).body("The API threw an error while processing the request")
        }
    }
