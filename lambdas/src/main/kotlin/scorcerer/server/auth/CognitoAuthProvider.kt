package scorcerer.server.auth

import aws.sdk.kotlin.services.cognitoidentityprovider.CognitoIdentityProviderClient
import aws.sdk.kotlin.services.cognitoidentityprovider.model.*
import org.http4k.core.Response
import org.http4k.core.Status
import scorcerer.server.ApiResponseError
import scorcerer.server.Environment

class CognitoAuthProvider : AuthProvider {
    private val client = CognitoIdentityProviderClient { region = "eu-west-2" }

    override suspend fun signup(email: String, pw: String, firstName: String, familyName: String): String {
        val createRequest = AdminCreateUserRequest {
            userPoolId = Environment.CognitoUserPoolId
            username = email
            messageAction = MessageActionType.Suppress
            userAttributes = listOf(
                AttributeType {
                    name = "email"
                    value = email
                },
                AttributeType {
                    name = "given_name"
                    value = firstName
                },
                AttributeType {
                    name = "family_name"
                    value = familyName
                },
                AttributeType {
                    name = "email_verified"
                    value = "true"
                },
            )
        }
        val passwordRequest = AdminSetUserPasswordRequest {
            userPoolId = Environment.CognitoUserPoolId
            username = email
            password = pw
            permanent = true
        }
        val deleteRequest = AdminDeleteUserRequest {
            userPoolId = Environment.CognitoUserPoolId
            username = email
        }
        try {
            val response = client.adminCreateUser(createRequest)
            try {
                client.adminSetUserPassword(passwordRequest)
            } catch (e: Exception) {
                client.adminDeleteUser(deleteRequest)
                throw e
            }
            return response.user?.attributes?.find { it.name == "sub" }?.value
                ?: throw Exception("Failed to find user sub")
        } catch (e: ApiResponseError) {
            throw e
        } catch (e: Exception) {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body(e.message ?: "Signup failed"))
        }
    }

    override suspend fun login(email: String, password: String): AuthTokens {
        val request = InitiateAuthRequest {
            authFlow = AuthFlowType.UserPasswordAuth
            clientId = Environment.CognitoUserPoolClientId
            authParameters = mapOf("USERNAME" to email, "PASSWORD" to password)
        }
        try {
            val response = client.initiateAuth(request)
            val result = response.authenticationResult
                ?: throw ApiResponseError(Response(Status.UNAUTHORIZED))
            return AuthTokens(
                idToken = result.idToken ?: throw Exception("No ID token"),
                accessToken = result.accessToken,
                refreshToken = result.refreshToken ?: "",
            )
        } catch (e: NotAuthorizedException) {
            throw ApiResponseError(Response(Status.UNAUTHORIZED).body(e.message))
        }
    }

    override suspend fun refresh(refreshToken: String): AuthTokens {
        val request = InitiateAuthRequest {
            authFlow = AuthFlowType.RefreshTokenAuth
            clientId = Environment.CognitoUserPoolClientId
            authParameters = mapOf("REFRESH_TOKEN" to refreshToken)
        }
        try {
            val response = client.initiateAuth(request)
            val result = response.authenticationResult
                ?: throw ApiResponseError(Response(Status.UNAUTHORIZED))
            return AuthTokens(
                idToken = result.idToken ?: throw Exception("No ID token"),
                accessToken = result.accessToken,
                refreshToken = refreshToken,
            )
        } catch (e: NotAuthorizedException) {
            throw ApiResponseError(Response(Status.UNAUTHORIZED).body(e.message))
        }
    }

    override suspend fun resetPassword(email: String) {
        client.forgotPassword(
            ForgotPasswordRequest {
                clientId = Environment.CognitoUserPoolClientId
                username = email
            },
        )
    }

    override suspend fun confirmReset(email: String, code: String, newPassword: String) {
        client.confirmForgotPassword(
            ConfirmForgotPasswordRequest {
                clientId = Environment.CognitoUserPoolClientId
                username = email
                confirmationCode = code
                password = newPassword
            },
        )
    }

    override suspend fun emailExists(email: String): Boolean {
        return try {
            client.adminGetUser(
                AdminGetUserRequest {
                    userPoolId = Environment.CognitoUserPoolId
                    username = email
                },
            )
            true
        } catch (_: UserNotFoundException) {
            false
        }
    }
}
