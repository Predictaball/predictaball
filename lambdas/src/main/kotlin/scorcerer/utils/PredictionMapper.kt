package scorcerer.utils

import org.openapitools.server.models.ToGoThrough
import scorcerer.server.db.tables.MatchResult

/**
 * The team a user backed to progress in a knockout match is persisted in
 * PredictionTable.result; expose it on the API model as [ToGoThrough]. Null for
 * group-stage predictions, and for any knockout prediction made before a side
 * was captured.
 */
fun MatchResult?.toToGoThrough(): ToGoThrough? = this?.let { ToGoThrough.valueOf(it.name) }
