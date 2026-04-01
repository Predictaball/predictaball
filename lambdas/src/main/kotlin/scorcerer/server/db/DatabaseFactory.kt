package scorcerer.server.db

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.core.StdOutSqlLogger
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.SchemaUtils
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import scorcerer.server.Environment
import scorcerer.server.db.tables.LeagueMembershipTable
import scorcerer.server.db.tables.LeagueTable
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.db.tables.TeamTable
import scorcerer.server.log

object DatabaseFactory {
    fun connectAndGenerateTables() {
        val dataSource = HikariDataSource(
            HikariConfig().apply {
                jdbcUrl = "jdbc:postgresql://${Environment.DatabaseUrl}:${Environment.DatabasePort}/${Environment.DatabaseName}"
                username = Environment.DatabaseUser
                password = Environment.DatabasePassword
                maximumPoolSize = 10
            },
        )

        Flyway.configure()
            .dataSource(dataSource)
            .baselineOnMigrate(true)
            .load()
            .migrate()
            .also { log.info("Flyway migrations applied: ${it.migrationsExecuted}") }

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
