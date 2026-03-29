package scorcerer.server

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

fun localAuthFilter(requestContext: RequestContexts) = Filter { next ->
    { req ->
        val testUserId = System.getenv("TEST_USER_ID") ?: "test-user"
        requestContext[req][AUTHORIZER_KEY] = Authorizer(
            claims = mapOf("sub" to testUserId, "custom:isAdmin" to "true"),
            scopes = emptyList(),
        )
        next(req)
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
