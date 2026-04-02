package scorcerer.server.db.tables

import org.jetbrains.exposed.v1.core.Table

object TeamTable : Table("team") {
    val id = integer("id").uniqueIndex().autoIncrement()
    val name = varchar("name", 30).uniqueIndex()
    val flagCode = varchar("flag_code", 100)
}
