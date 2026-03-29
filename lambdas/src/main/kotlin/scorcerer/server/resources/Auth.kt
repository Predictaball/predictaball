package scorcerer.server.resources

import aws.sdk.kotlin.services.cognitoidentityprovider.CognitoIdentityProviderClient
import aws.sdk.kotlin.services.cognitoidentityprovider.model.AuthFlowType
import aws.sdk.kotlin.services.cognitoidentityprovider.model.ConfirmForgotPasswordRequest
import aws.sdk.kotlin.services.cognitoidentityprovider.model.ForgotPasswordRequest
import aws.sdk.kotlin.services.cognitoidentityprovider.model.InitiateAuthRequest
import aws.sdk.kotlin.services.cognitoidentityprovider.model.NotAuthorizedException
import kotlinx.coroutines.runBlocking
import org.http4k.core.Method
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.routes
import org.openapitools.server.models.Login200Response
import org.openapitools.server.models.LoginRequest
import org.openapitools.server.models.ResetPasswordConfirmRequest
import org.openapitools.server.models.ResetPasswordRequest
import scorcerer.server.ApiResponseError
import scorcerer.server.Environment
import scorcerer.server.fromJson
import scorcerer.server.log
import scorcerer.server.toJson

private val cognitoClient = CognitoIdentityProviderClient { region = "eu-west-2" }

val authRoutes = routes(
    "/auth/login" bind Method.POST to { req ->
        val body: LoginRequest = req.bodyString().fromJson()
        val request = InitiateAuthRequest {
            authFlow = AuthFlowType.UserPasswordAuth
            clientId = Environment.CognitoUserPoolClientId
            authParameters = mapOf("USERNAME" to body.email, "PASSWORD" to body.password)
        }
        log.info("Using auth type - ${request.authFlow?.value}")
        val response = runBlocking {
            try {
                cognitoClient.initiateAuth(request)
            } catch (e: NotAuthorizedException) {
                throw ApiResponseError(Response(Status.UNAUTHORIZED).body(e.message))
            }
        }
        val result = response.authenticationResult ?: throw ApiResponseError(Response(Status.UNAUTHORIZED))
        if (result.idToken == null) throw Exception("Cognito did not return an ID token")
        Response(Status.OK).body(Login200Response(result.idToken!!, result.accessToken).toJson())
    },
    "/auth/reset" bind Method.POST to { req ->
        val body: ResetPasswordRequest = req.bodyString().fromJson()
        log.info("Resetting password for email - ${body.email}")
        runBlocking {
            try {
                cognitoClient.forgotPassword(
                    ForgotPasswordRequest {
                        username = body.email
                        clientId = Environment.CognitoUserPoolClientId
                    },
                )
            } catch (e: Exception) {
                log.error("Failed to reset users password - $e")
                throw ApiResponseError(Response(Status.BAD_REQUEST).body("Failed to reset users password"))
            }
        }
        Response(Status.OK)
    },
    "/auth/reset-confirm" bind Method.POST to { req ->
        val body: ResetPasswordConfirmRequest = req.bodyString().fromJson()
        log.info("Confirming password reset for email - ${body.email}")
        runBlocking {
            try {
                cognitoClient.confirmForgotPassword(
                    ConfirmForgotPasswordRequest {
                        username = body.email
                        confirmationCode = body.otp
                        password = body.password
                        clientId = Environment.CognitoUserPoolClientId
                    },
                )
            } catch (e: Exception) {
                log.error("Failed to confirm password reset - $e")
                throw ApiResponseError(Response(Status.BAD_REQUEST).body("Failed to reset users password"))
            }
        }
        Response(Status.OK)
    },
    "/auth/ping" bind Method.GET to { Response(Status.OK) },
)
