package scorcerer.server.events

data class UserCreationEvent(
    val id: String,
    val firstName: String,
    val familyName: String,
)
