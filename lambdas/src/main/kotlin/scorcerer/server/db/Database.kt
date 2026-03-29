package scorcerer.server.db

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.StdOutSqlLogger
import org.jetbrains.exposed.sql.addLogger
import org.jetbrains.exposed.sql.transactions.transaction
import scorcerer.server.Environment
import scorcerer.server.db.tables.LeagueMembershipTable
import scorcerer.server.db.tables.LeagueTable
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.db.tables.TeamTable

object Database {
    fun connectAndGenerateTables() {
        val dataSource = HikariDataSource(
            HikariConfig().apply {
                jdbcUrl = "jdbc:postgresql://${Environment.DatabaseUrl}:${Environment.DatabasePort}/${Environment.DatabaseName}"
                username = Environment.DatabaseUser
                password = Environment.DatabasePassword
                maximumPoolSize = 10
            },
        )

        Database.connect(dataSource)
        generateTables()
    }

    fun generateTables() {
        transaction {
            addLogger(StdOutSqlLogger)
            SchemaUtils.create(MatchTable, LeagueMembershipTable, LeagueTable, MemberTable, PredictionTable, TeamTable)
        }
    }

    fun dropTables() {
        transaction {
            SchemaUtils.drop(MatchTable, LeagueMembershipTable, LeagueTable, MemberTable, PredictionTable, TeamTable)
        }
    }
}
