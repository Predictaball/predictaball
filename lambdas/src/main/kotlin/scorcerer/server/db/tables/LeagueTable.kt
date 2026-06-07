package scorcerer.server.db.tables

import org.jetbrains.exposed.v1.core.Table
import org.openapitools.server.models.League

enum class LeagueKind {
    GLOBAL,
    COUNTRY,
    USER,
    ;

    fun toApiKind(): League.Kind = when (this) {
        GLOBAL -> League.Kind.GLOBAL
        COUNTRY -> League.Kind.COUNTRY
        USER -> League.Kind.USER
    }
}

object LeagueTable : Table("league") {
    val id = varchar("id", 40).uniqueIndex()
    val name = varchar("name", 30)
    val kind = enumerationByName<LeagueKind>("kind", 20)
    override val primaryKey = PrimaryKey(id)
}
