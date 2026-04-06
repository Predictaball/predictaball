package scorcerer.server

data class Authorizer(
    val claims: Map<String, String>,
    val scopes: List<String>,
)

const val AUTHORIZER_KEY = "HTTP4K_AUTHORIZER"
