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
import org.openapitools.server.models.CreatePrediction200Response
import org.openapitools.server.models.CreatePredictionRequest
import org.openapitools.server.models.Prediction
import scorcerer.server.ApiResponseError
import scorcerer.server.db.tables.MatchResult
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.extractUserId
import scorcerer.server.fromJson
import scorcerer.server.toJson
import java.time.OffsetDateTime

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
        predictionId?.let { id ->
            transaction {
                PredictionTable.update({ PredictionTable.id eq id }) {
                    it[homeScore] = body.homeScore
                    it[awayScore] = body.awayScore
                    it[result] = body.toGoThrough?.let { MatchResult.valueOf(body.toGoThrough.value) }
                }
            }
        } ?: run {
            predictionId = transaction {
                PredictionTable.insert {
                    it[memberId] = requesterUserId
                    it[matchId] = body.matchId.toInt()
                    it[homeScore] = body.homeScore
                    it[awayScore] = body.awayScore
                } get PredictionTable.id
            }
        }
        Response(Status.OK).body(CreatePrediction200Response(predictionId.toString()).toJson())
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
