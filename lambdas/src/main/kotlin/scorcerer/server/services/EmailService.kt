package scorcerer.server.services

import scorcerer.server.log
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

object EmailService {
    private val apiKey = System.getenv("RESEND_API_KEY")
    private val client = HttpClient.newHttpClient()

    fun send(to: String, subject: String, html: String) {
        if (apiKey.isNullOrBlank()) {
            log.info("RESEND_API_KEY not set, skipping email to $to: $subject")
            return
        }

        val body = """{"from":"Predictaball <noreply@predictaball.live>","to":["$to"],"subject":"$subject","html":"$html"}"""

        try {
            val request = HttpRequest.newBuilder()
                .uri(URI("https://api.resend.com/emails"))
                .header("Authorization", "Bearer $apiKey")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build()
            val response = client.send(request, HttpResponse.BodyHandlers.ofString())
            if (response.statusCode() !in 200..299) {
                log.error("Resend API error: ${response.statusCode()} ${response.body()}")
            } else {
                log.info("Email sent to $to: $subject")
            }
        } catch (e: Exception) {
            log.error("Failed to send email to $to: ${e.message}")
        }
    }
}
