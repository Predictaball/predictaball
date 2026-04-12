package scorcerer.server

import com.auth0.jwk.JwkProviderBuilder
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

fun localAuthFilter(requestContext: RequestContexts) = Filter { next ->
    { req ->
        val token = req.header("Authorization")?.removePrefix("Bearer ")
        if (token.isNullOrBlank()) {
            next(req)
        } else {
            try {
                val verifier = JWT.require(scorcerer.server.auth.LocalAuthProvider.algorithm).build()
                val verified = verifier.verify(token)
                requestContext[req][AUTHORIZER_KEY] = Authorizer(
                    claims = verified.claims.mapValues { it.value.asString() ?: "" },
                    scopes = emptyList(),
                )
            } catch (e: Exception) {
                log.error("Local JWT verification failed: ${e.message}")
            }
            next(req)
        }
    }
}

fun cognitoAuthFilter(requestContext: RequestContexts) = Filter { next ->
    { req ->
        val token = req.header("Authorization")?.removePrefix("Bearer ")
        if (token.isNullOrBlank()) {
            next(req)
        } else {
            try {
                val jwksUrl = "https://cognito-idp.${System.getenv("AWS_REGION") ?: "eu-west-2"}.amazonaws.com/${Environment.CognitoUserPoolId}/.well-known/jwks.json"
                val provider = JwkProviderBuilder(java.net.URI(jwksUrl).toURL())
                    .cached(10, 24, java.util.concurrent.TimeUnit.HOURS)
                    .build()
                val decoded = JWT.decode(token)
                val jwk = provider.get(decoded.keyId)
                val algorithm = Algorithm.RSA256(jwk.publicKey as java.security.interfaces.RSAPublicKey, null)
                val verifier = JWT.require(algorithm)
                    .withIssuer("https://cognito-idp.${System.getenv("AWS_REGION") ?: "eu-west-2"}.amazonaws.com/${Environment.CognitoUserPoolId}")
                    .build()
                val verified = verifier.verify(token)
                requestContext[req][AUTHORIZER_KEY] = Authorizer(
                    claims = verified.claims.mapValues { it.value.asString() ?: "" },
                    scopes = emptyList(),
                )
            } catch (e: Exception) {
                log.error("JWT verification failed: ${e.message}")
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
