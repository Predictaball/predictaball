package scorcerer.utils

import org.jetbrains.exposed.v1.core.ResultRow
import org.openapitools.server.models.User
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.TeamTable

/**
 * Build a [User] from a result row. The query MUST left-join [TeamTable] (on
 * MemberTable.supportedTeamId) so the supported-team columns are present; for members
 * with no supported team the left join yields nulls.
 */
fun ResultRow.toUser(livePoints: Int = 0): User = User(
    this[MemberTable.firstName],
    this[MemberTable.familyName],
    this[MemberTable.id],
    this[MemberTable.doublePointsChips],
    this[MemberTable.oneOutChips],
    this[MemberTable.crowdChips],
    this[MemberTable.fixedPoints],
    livePoints,
    this.getOrNull(TeamTable.name)?.toTitleCase(),
    this.getOrNull(TeamTable.flagCode),
)
