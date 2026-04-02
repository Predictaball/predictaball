package scorcerer.integration

import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.BeforeEach
import scorcerer.server.db.DatabaseFactory

open class PostgresTest {
    companion object {
        private val dbUrl = System.getenv("INTEGRATION_DB_URL") ?: "jdbc:postgresql://localhost:5432/postgres"
        private val dbUser = System.getenv("INTEGRATION_DB_USER") ?: "postgres"
        private val dbPassword = System.getenv("INTEGRATION_DB_PASSWORD") ?: "postgres"

        init {
            Database.connect(url = dbUrl, driver = "org.postgresql.Driver", user = dbUser, password = dbPassword)
        }
    }

    @BeforeEach
    fun resetDatabase() = transaction {
        DatabaseFactory.dropTables()
        DatabaseFactory.generateTables()
    }
}
