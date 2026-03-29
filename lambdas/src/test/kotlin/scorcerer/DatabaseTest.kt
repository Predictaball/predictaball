package scorcerer

import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.BeforeEach
import scorcerer.server.db.DatabaseFactory

open class DatabaseTest {
    init {
        Database.connect(
            "jdbc:h2:mem:test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=2",
            driver = "org.h2.Driver",
        )
    }

    @BeforeEach
    fun resetDatabases() = transaction {
        DatabaseFactory.dropTables()
        DatabaseFactory.generateTables()
    }
}
