package scorcerer.server.resources

import org.http4k.core.Method
import org.http4k.core.RequestContexts
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.path
import org.http4k.routing.routes
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.update
import org.openapitools.server.models.Chip
import org.openapitools.server.models.CreatePrediction200Response
import org.openapitools.server.models.CreatePredictionRequest
import org.openapitools.server.models.Prediction
import scorcerer.server.ApiResponseError
import scorcerer.server.db.tables.MatchResult
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.extractUserId
import scorcerer.server.fromJson
import scorcerer.server.toJson
import java.time.OffsetDateTime

private fun chipColumn(chip: Chip) = when (chip) {
    Chip.DOUBLE_POINTS -> MemberTable.doublePointsChips
    Chip.ONE_GOAL_OUT -> MemberTable.oneOutChips
    Chip.CROWD -> MemberTable.crowdChips
    Chip.NONE -> throw IllegalArgumentException("NONE has no column")
}

fun predictionRoutes(contexts: RequestContexts) = routes(
    "/prediction" bind Method.POST to { req ->
        val requesterUserId = contexts.extractUserId(req)
        val body: CreatePredictionRequest = req.bodyString().fromJson()
        val matchDatetime = transaction {
            MatchTable.selectAll().where { MatchTable.id eq body.matchId.toInt() }
                .firstOrNull()?.let { it[MatchTable.datetime] }
                ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Match does not exist"))
        }
        if (matchDatetime.isBefore(OffsetDateTime.now())) {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("Match is not in future"))
        }
        var predictionId = transaction {
            PredictionTable.selectAll()
                .where { (PredictionTable.memberId eq requesterUserId).and(PredictionTable.matchId eq body.matchId.toInt()) }
                .firstOrNull()?.let { it[PredictionTable.id] }
        }

        val requestedChip = body.chip ?: Chip.NONE

        predictionId?.let { id ->
            val previousChip = transaction {
                PredictionTable.selectAll().where { PredictionTable.id eq id }
                    .first()[PredictionTable.chip]
            }
            if (previousChip != requestedChip) {
                transaction {
                    val member = MemberTable.selectAll().where { MemberTable.id eq requesterUserId }.first()
                    if (requestedChip != Chip.NONE) {
                        val column = chipColumn(requestedChip)
                        val remaining = member[column]
                        if (remaining <= 0) {
                            throw ApiResponseError(Response(Status.BAD_REQUEST).body("No $requestedChip chips remaining"))
                        }
                        MemberTable.update({ MemberTable.id eq requesterUserId }) { it[column] = remaining - 1 }
                    }
                    if (previousChip != Chip.NONE) {
                        val column = chipColumn(previousChip)
                        MemberTable.update({ MemberTable.id eq requesterUserId }) { it[column] = member[column] + 1 }
                    }
                }
            }
            transaction {
                PredictionTable.update({ PredictionTable.id eq id }) {
                    it[homeScore] = body.homeScore
                    it[awayScore] = body.awayScore
                    it[chip] = requestedChip
                    it[result] = body.toGoThrough?.let { MatchResult.valueOf(body.toGoThrough.value) }
                }
            }
        } ?: run {
            if (requestedChip != Chip.NONE) {
                transaction {
                    val column = chipColumn(requestedChip)
                    val remaining = MemberTable.selectAll().where { MemberTable.id eq requesterUserId }
                        .first()[column]
                    if (remaining <= 0) {
                        throw ApiResponseError(Response(Status.BAD_REQUEST).body("No $requestedChip chips remaining"))
                    }
                    MemberTable.update({ MemberTable.id eq requesterUserId }) { it[column] = remaining - 1 }
                }
            }
            predictionId = transaction {
                PredictionTable.insert {
                    it[memberId] = requesterUserId
                    it[matchId] = body.matchId.toInt()
                    it[homeScore] = body.homeScore
                    it[awayScore] = body.awayScore
                    it[chip] = requestedChip
                    it[result] = body.toGoThrough?.let { v -> MatchResult.valueOf(v.value) }
                } get PredictionTable.id
            }
        }
        val (doublePointsRemaining, oneOutRemaining, crowdRemaining) = transaction {
            val member = MemberTable.selectAll().where { MemberTable.id eq requesterUserId }.first()
            Triple(
                member[MemberTable.doublePointsChips],
                member[MemberTable.oneOutChips],
                member[MemberTable.crowdChips],
            )
        }
        Response(Status.OK).body(
            CreatePrediction200Response(
                predictionId.toString(),
                doublePointsRemaining,
                oneOutRemaining,
                crowdRemaining,
            ).toJson(),
        )
    },
    "/prediction/{matchId}" bind Method.GET to { req ->
        val requesterUserId = contexts.extractUserId(req)
        val matchId = req.path("matchId")!!
        val prediction = transaction {
            PredictionTable.selectAll()
                .where { (PredictionTable.matchId eq matchId.toInt()).and(PredictionTable.memberId eq requesterUserId) }
                .firstOrNull()?.let { row ->
                    Prediction(
                        row[PredictionTable.homeScore],
                        row[PredictionTable.chip],
                        row[PredictionTable.awayScore],
                        row[PredictionTable.matchId].toString(),
                        row[PredictionTable.id].toString(),
                        row[PredictionTable.memberId],
                        row[PredictionTable.points],
                    )
                } ?: throw ApiResponseError(Response(Status.NOT_FOUND).body("Match does not exist"))
        }
        Response(Status.OK).body(prediction.toJson())
    },
)
