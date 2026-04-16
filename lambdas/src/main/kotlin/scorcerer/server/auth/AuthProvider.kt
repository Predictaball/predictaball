package scorcerer.server.auth

data class AuthTokens(
    val idToken: String,
    val accessToken: String?,
    val refreshToken: String,
)

interface AuthProvider {
    suspend fun signup(email: String, pw: String, firstName: String, familyName: String): String
    suspend fun login(email: String, password: String): AuthTokens
    suspend fun refresh(refreshToken: String): AuthTokens
    suspend fun resetPassword(email: String)
    suspend fun confirmReset(email: String, code: String, newPassword: String)
    suspend fun emailExists(email: String): Boolean
}
