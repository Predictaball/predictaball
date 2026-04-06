package scorcerer.server

import org.http4k.core.Response

data class ApiResponseError(val response: Response) : Exception("API failed while executing request handler and provided error response")
