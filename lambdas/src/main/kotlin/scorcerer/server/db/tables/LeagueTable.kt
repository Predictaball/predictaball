package scorcerer.server.db.tables

import org.jetbrains.exposed.v1.core.Table

object LeagueTable : Table("league") {
    val id = varchar("id", 30).uniqueIndex()
    val name = varchar("name", 30)
    override val primaryKey = PrimaryKey(id)
}
