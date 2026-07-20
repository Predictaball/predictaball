package scorcerer.server.services

// Renders the end-of-tournament thank-you / stats email. Kept as a pure
// renderer with a hardcoded fake stats blob for iteration — real stats are
// wired up in a follow-up.
object TournamentRecapEmail {

    // Brand palette pulled from frontend/app/util/css-classes.ts. Email clients
    // strip <style> blocks (Gmail web) so every colour lives inline.
    private const val BRAND_START = "#3b82f6" // blue-500
    private const val BRAND_MID = "#22d3ee" // cyan-400
    private const val BRAND_END = "#5eead4" // teal-300

    private const val SLATE_50 = "#f8fafc"
    private const val SLATE_200 = "#e2e8f0"
    private const val SLATE_400 = "#94a3b8"
    private const val SLATE_500 = "#64748b"
    private const val SLATE_700 = "#334155"
    private const val SLATE_900 = "#0f172a"

    private const val CYAN_600 = "#0891b2"

    // The tournament (Spain, in our case) lifting the trophy. Shown on
    // every recap as a shared closing moment for the World Cup.
    data class TournamentChampion(
        val teamName: String,
        val flagCode: String,
        val runnerUpName: String,
        val runnerUpFlagCode: String,
        val finalHomeScore: Int,
        val finalAwayScore: Int,
    )

    // Podium of the top-3 global-leaderboard finishers, called out on
    // every user's recap so the winners are visible tournament-wide.
    data class PodiumEntry(
        val firstName: String,
        val familyName: String,
        val countryName: String,
        val flagCode: String,
        val points: Int,
        val isMe: Boolean,
    )

    data class RecapStats(
        val firstName: String,
        val finalPoints: Int,
        val finalRank: Int,
        val totalPlayers: Int,
        val predictionsMade: Int,
        val totalMatches: Int,
        val bestPrediction: BestPrediction?,
        val customLeaguesCount: Int,
        val countryRank: CountryRank?,
        // Knockout side-league standing. Nullable so users who didn't score
        // any knockout points don't get an empty card.
        val knockoutRank: KnockoutRank?,
        // Shared tournament-wide closing content.
        val champion: TournamentChampion,
        val podium: List<PodiumEntry>,
    )

    data class BestPrediction(
        val points: Int,
        val homeName: String,
        val homeFlagCode: String,
        val awayName: String,
        val awayFlagCode: String,
        val actualHome: Int,
        val actualAway: Int,
        val roundLabel: String,
        // Chip used on the top prediction, if any. Shown as a small badge on
        // the card so users can see when their best score was chip-boosted
        // — the points value is already post-chip.
        val chipLabel: String? = null,
    )

    data class CountryRank(
        val countryName: String,
        val flagCode: String,
        val rank: Int,
        val total: Int,
    )

    data class KnockoutRank(
        val points: Int,
        val rank: Int,
        val total: Int,
    )

    // A representative fake profile used to iterate on the layout locally
    // before real per-user stats are plumbed through. Numbers here mirror
    // Luke's real end-of-tournament data so the preview reads plausibly.
    val FAKE_STATS = RecapStats(
        firstName = "Luke",
        finalPoints = 161,
        finalRank = 36,
        totalPlayers = 118,
        predictionsMade = 104,
        totalMatches = 104,
        bestPrediction = BestPrediction(
            points = 5,
            homeName = "France",
            homeFlagCode = "fr",
            awayName = "Senegal",
            awayFlagCode = "sn",
            actualHome = 3,
            actualAway = 1,
            roundLabel = "Group Stage",
        ),
        customLeaguesCount = 8,
        countryRank = CountryRank(
            countryName = "England",
            flagCode = "gb-eng",
            rank = 16,
            total = 52,
        ),
        knockoutRank = KnockoutRank(points = 67, rank = 16, total = 77),
        champion = TournamentChampion(
            teamName = "Spain",
            flagCode = "es",
            runnerUpName = "Argentina",
            runnerUpFlagCode = "ar",
            finalHomeScore = 1,
            finalAwayScore = 0,
        ),
        podium = listOf(
            PodiumEntry("Kevin", "Ely", "England", "gb-eng", 195, isMe = false),
            PodiumEntry("Robert", "Halls", "England", "gb-eng", 191, isMe = false),
            PodiumEntry("Mark", "Ely", "England", "gb-eng", 190, isMe = false),
        ),
    )

    // Ali Colver's real end-of-tournament data. Used for the preview send
    // gathering feedback from him. Real per-user stats plumb through the
    // same shape.
    val ALI_STATS = RecapStats(
        firstName = "Ali",
        finalPoints = 177,
        finalRank = 10,
        totalPlayers = 118,
        predictionsMade = 104,
        totalMatches = 104,
        bestPrediction = BestPrediction(
            points = 5,
            homeName = "Argentina",
            homeFlagCode = "ar",
            awayName = "Austria",
            awayFlagCode = "at",
            actualHome = 2,
            actualAway = 0,
            roundLabel = "Group Stage",
        ),
        customLeaguesCount = 8,
        countryRank = CountryRank(
            countryName = "Scotland",
            flagCode = "gb-sct",
            rank = 4,
            total = 40,
        ),
        knockoutRank = KnockoutRank(points = 77, rank = 5, total = 77),
        champion = TournamentChampion(
            teamName = "Spain",
            flagCode = "es",
            runnerUpName = "Argentina",
            runnerUpFlagCode = "ar",
            finalHomeScore = 1,
            finalAwayScore = 0,
        ),
        podium = listOf(
            PodiumEntry("Kevin", "Ely", "England", "gb-eng", 195, isMe = false),
            PodiumEntry("Robert", "Halls", "England", "gb-eng", 191, isMe = false),
            PodiumEntry("Mark", "Ely", "England", "gb-eng", 190, isMe = false),
        ),
    )

    fun subject(stats: RecapStats): String = when (stats.finalRank) {
        1 -> "You won Predictaball — World Cup 2026 wrap"
        else -> "Your World Cup 2026 wrap"
    }

    fun render(stats: RecapStats): String {
        val predictionPct = if (stats.totalMatches == 0) {
            0
        } else {
            (stats.predictionsMade * 100 + stats.totalMatches / 2) / stats.totalMatches
        }

        return """
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>World Cup 2026 — your tournament in numbers</title>
</head>
<body style="margin:0;padding:0;background:$SLATE_50;font-family:'Space Grotesk','Segoe UI',Helvetica,Arial,sans-serif;color:$SLATE_900;-webkit-font-smoothing:antialiased;">
<!-- Preheader: inbox preview text. Also gives Gmail per-user variation so it
     doesn't collapse the tail of the body into a "..." trim. -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  ${escape(stats.firstName)} &middot; ${stats.finalPoints} pts &middot; #${stats.finalRank} of ${stats.totalPlayers} &middot; World Cup 2026 wrap
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:$SLATE_50;padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">

        ${renderHeader()}

        ${renderHero(stats)}

        ${renderChampionCard(stats.champion)}

        ${if (stats.knockoutRank != null) renderKnockoutCard(stats.knockoutRank) else ""}

        ${renderBestPredictionCard(stats.bestPrediction)}

        ${renderPredictionRateCard(stats.predictionsMade, stats.totalMatches, predictionPct)}

        ${if (stats.customLeaguesCount > 0) renderCustomLeaguesCard(stats.customLeaguesCount) else ""}

        ${if (stats.countryRank != null) renderCountryCard(stats.countryRank) else ""}

        ${renderPodiumCard(stats.podium)}

        ${renderClosing()}

        ${renderFooter()}

      </table>
    </td>
  </tr>
</table>
</body>
</html>
        """.trimIndent()
    }

    private fun renderHeader(): String = """
<tr><td style="padding:0 0 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td align="center" style="font-family:'Space Grotesk','Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;font-weight:900;letter-spacing:-0.01em;color:$SLATE_900;">
      <span style="background:linear-gradient(90deg,$BRAND_START,$BRAND_MID,$BRAND_END);-webkit-background-clip:text;background-clip:text;color:transparent;">predicta</span><span style="color:$SLATE_900;">ball</span>
    </td>
  </tr></table>
</td></tr>
"""

    private fun renderHero(stats: RecapStats): String {
        // Rank 1 gets a champion eyebrow; 2/3 get a top-3 nudge. Everyone
        // else lands on the neutral "World Cup 2026" tournament label.
        val eyebrow = when (stats.finalRank) {
            1 -> "&#127942; Predictaball Champion"
            2, 3 -> "Top-3 finisher"
            else -> "World Cup 2026"
        }
        val greeting = when (stats.finalRank) {
            1 -> "You won it, ${escape(stats.firstName)}."
            else -> "That's a wrap, ${escape(stats.firstName)}."
        }
        val subtitle = when (stats.finalRank) {
            1 -> "The Predictaball crown is yours. Here's how the tournament played out for you."
            2, 3 -> "A podium finish. Here's the tournament in your numbers."
            else -> "Thanks for playing. Here's your World Cup 2026 in numbers."
        }
        return """
<tr><td style="padding:12px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid $SLATE_200;border-radius:20px;">
    <tr><td align="center" style="padding:36px 24px 32px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:$SLATE_500;">$eyebrow</div>
      <div style="margin-top:12px;font-size:34px;font-weight:900;letter-spacing:-0.02em;color:$SLATE_900;line-height:1.1;">
        $greeting
      </div>
      <div style="margin-top:14px;font-size:15px;color:$SLATE_500;line-height:1.55;max-width:420px;margin-left:auto;margin-right:auto;">
        $subtitle
      </div>
      <div style="margin:26px auto 4px;font-size:64px;font-weight:900;line-height:1;letter-spacing:-0.02em;background:linear-gradient(90deg,$BRAND_START,$BRAND_MID,$BRAND_END);-webkit-background-clip:text;background-clip:text;color:$BRAND_MID;">
        ${stats.finalPoints}
      </div>
      <div style="margin-top:6px;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:$SLATE_500;">points</div>
      <div style="margin-top:18px;display:inline-block;padding:8px 18px;border-radius:9999px;background:$SLATE_50;border:1px solid $SLATE_200;">
        <span style="font-size:15px;font-weight:800;color:$SLATE_900;letter-spacing:-0.01em;">#${stats.finalRank}</span>
        <span style="font-size:12px;font-weight:700;color:$SLATE_500;"> of ${stats.totalPlayers} globally</span>
      </div>
    </td></tr>
  </table>
</td></tr>
"""
    }

    // Tournament-wide moment: name the winning nation. Shown to every user so
    // the recap frames itself as a World Cup close, not just a stats sheet.
    private fun renderChampionCard(c: TournamentChampion): String = """
<tr><td style="padding:8px 0;">
  ${card(
        """
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:$SLATE_500;">World champions</td>
      <td align="right" style="font-size:12px;color:$SLATE_400;">The final</td>
    </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr>
        <td width="42%" align="left" style="vertical-align:middle;">
          ${flag(c.flagCode, c.teamName, 56)}
          <div style="margin-top:8px;font-size:16px;font-weight:900;color:$SLATE_900;letter-spacing:-0.01em;">${escape(shortName(c.teamName))}</div>
          <div style="margin-top:2px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:$CYAN_600;">Champions &#127942;</div>
        </td>
        <td width="16%" align="center" style="vertical-align:middle;white-space:nowrap;">
          <div style="font-size:26px;font-weight:900;color:$SLATE_900;letter-spacing:-0.02em;white-space:nowrap;">${c.finalHomeScore}&nbsp;&ndash;&nbsp;${c.finalAwayScore}</div>
        </td>
        <td width="42%" align="right" style="vertical-align:middle;">
          ${flag(c.runnerUpFlagCode, c.runnerUpName, 56)}
          <div style="margin-top:8px;font-size:16px;font-weight:900;color:$SLATE_700;letter-spacing:-0.01em;">${escape(shortName(c.runnerUpName))}</div>
          <div style="margin-top:2px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:$SLATE_400;">Runners-up</div>
        </td>
      </tr>
    </table>
    """,
    )}
</td></tr>
"""

    private fun renderRankCard(stats: RecapStats): String {
        val medal = when (stats.finalRank) {
            1 -> "&#127942;"
            2 -> "&#129352;"
            3 -> "&#129353;"
            else -> ""
        }
        return """
<tr><td style="padding:8px 0;">
  ${card(
            """
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:$SLATE_500;">Final rank</td>
      <td align="right" style="font-size:12px;color:$SLATE_400;">Global leaderboard</td>
    </tr></table>
    <div style="margin-top:10px;font-size:30px;font-weight:900;letter-spacing:-0.01em;color:$SLATE_900;">
      $medal #${stats.finalRank}<span style="font-size:14px;font-weight:700;color:$SLATE_500;"> of ${stats.totalPlayers}</span>
    </div>
    """,
        )}
</td></tr>
"""
    }

    // Knockout side-league (predictions from R32 onwards only). Same visual
    // as the global rank card but tinted so the two don't blur together.
    private fun renderKnockoutCard(k: KnockoutRank): String = """
<tr><td style="padding:8px 0;">
  ${card(
        """
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:$SLATE_500;">Knockout league</td>
      <td align="right" style="font-size:12px;color:$SLATE_400;">R32 onwards only</td>
    </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
      <tr>
        <td align="left" style="vertical-align:middle;">
          <div style="font-size:30px;font-weight:900;letter-spacing:-0.01em;color:$SLATE_900;">
            #${k.rank}<span style="font-size:14px;font-weight:700;color:$SLATE_500;"> of ${k.total}</span>
          </div>
        </td>
        <td align="right" style="vertical-align:middle;">
          <span style="display:inline-block;padding:6px 14px;border-radius:9999px;background:$SLATE_50;border:1px solid $SLATE_200;font-size:13px;font-weight:800;color:$SLATE_700;">
            ${k.points} pts
          </span>
        </td>
      </tr>
    </table>
    """,
    )}
</td></tr>
"""

    private fun renderBestPredictionCard(b: BestPrediction?): String {
        if (b == null) return ""
        val chipBadge = if (b.chipLabel != null) {
            """<span style="display:inline-block;margin-left:8px;padding:3px 10px;border-radius:9999px;background:$SLATE_50;border:1px solid $SLATE_200;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:$CYAN_600;">${escape(b.chipLabel)}</span>"""
        } else {
            ""
        }
        return """
<tr><td style="padding:8px 0;">
  ${card(
            """
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:$SLATE_500;">Best call$chipBadge</td>
      <td align="right" style="font-size:12px;font-weight:600;color:$SLATE_400;">${escape(b.roundLabel)}</td>
    </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr>
        <td width="35%" align="left" style="vertical-align:middle;">
          ${flag(b.homeFlagCode, b.homeName)}
          <div style="margin-top:8px;font-size:13px;font-weight:700;color:$SLATE_700;">${escape(shortName(b.homeName))}</div>
        </td>
        <td width="30%" align="center" style="vertical-align:middle;white-space:nowrap;">
          <div style="font-size:28px;font-weight:900;color:$SLATE_900;letter-spacing:-0.02em;white-space:nowrap;">${b.actualHome}&nbsp;&ndash;&nbsp;${b.actualAway}</div>
          <div style="margin-top:6px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:$SLATE_400;">Result</div>
        </td>
        <td width="35%" align="right" style="vertical-align:middle;">
          ${flag(b.awayFlagCode, b.awayName)}
          <div style="margin-top:8px;font-size:13px;font-weight:700;color:$SLATE_700;">${escape(shortName(b.awayName))}</div>
        </td>
      </tr>
    </table>
    <div style="margin-top:18px;text-align:center;">
      <span style="display:inline-block;padding:8px 16px;border-radius:9999px;background:linear-gradient(90deg,$BRAND_START,$BRAND_MID,$BRAND_END);color:#0f172a;font-size:14px;font-weight:800;">
        +${b.points} points
      </span>
    </div>
    """,
        )}
</td></tr>
"""
    }

    private fun renderPredictionRateCard(made: Int, total: Int, pct: Int): String {
        // Progress meter built as a two-cell table. Width by percentage is the
        // only technique that renders reliably across Outlook, Gmail web and
        // Apple Mail. A rest-cell fills the remaining space; when pct=100 the
        // whole row is the fill, when pct=0 it collapses cleanly.
        val fillWidth = pct.coerceIn(0, 100)
        val restWidth = 100 - fillWidth
        val fillCell = """<td width="$fillWidth%" height="10" style="background:linear-gradient(90deg,$BRAND_START,$BRAND_MID,$BRAND_END);height:10px;line-height:10px;font-size:0;">&nbsp;</td>"""
        val restCell = if (restWidth > 0) """<td width="$restWidth%" height="10" style="background:$SLATE_50;height:10px;line-height:10px;font-size:0;">&nbsp;</td>""" else ""
        return """
<tr><td style="padding:8px 0;">
  ${card(
            """
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:$SLATE_500;">Prediction rate</td>
      <td align="right" style="font-size:14px;font-weight:700;color:$SLATE_700;">$made <span style="color:$SLATE_400;font-weight:500;">of $total</span></td>
    </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border:1px solid $SLATE_200;border-radius:9999px;overflow:hidden;">
      <tr>$fillCell$restCell</tr>
    </table>
    <div style="margin-top:10px;text-align:right;font-size:28px;font-weight:900;letter-spacing:-0.01em;color:$SLATE_900;">$pct%</div>
    """,
        )}
</td></tr>
"""
    }

    private fun renderCustomLeaguesCard(count: Int): String {
        val label = if (count == 1) "custom league" else "custom leagues"
        return """
<tr><td style="padding:8px 0;">
  ${card(
            """
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:$SLATE_500;">Leagues joined</td>
      <td align="right" style="font-size:12px;color:$SLATE_400;">With your friends</td>
    </tr></table>
    <div style="margin-top:10px;font-size:30px;font-weight:900;letter-spacing:-0.01em;color:$SLATE_900;">
      $count <span style="font-size:14px;font-weight:700;color:$SLATE_500;">$label</span>
    </div>
    """,
        )}
</td></tr>
"""
    }

    private fun renderCountryCard(c: CountryRank): String = """
<tr><td style="padding:8px 0;">
  ${card(
        """
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:$SLATE_500;">Country standing</td>
      <td align="right" style="font-size:12px;color:$SLATE_400;">Among ${escape(c.countryName)} fans</td>
    </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
      <tr>
        <td align="left" style="vertical-align:middle;">
          ${flag(c.flagCode, c.countryName)}
        </td>
        <td align="right" style="vertical-align:middle;">
          <div style="font-size:26px;font-weight:900;color:$SLATE_900;letter-spacing:-0.01em;">
            #${c.rank}<span style="font-size:14px;font-weight:700;color:$SLATE_500;"> of ${c.total}</span>
          </div>
        </td>
      </tr>
    </table>
    """,
    )}
</td></tr>
"""

    // Global top-3 podium — same content for everyone. Highlights the row
    // for the current recipient if they're on it.
    private fun renderPodiumCard(podium: List<PodiumEntry>): String {
        if (podium.isEmpty()) return ""
        val medals = listOf("&#127942;", "&#129352;", "&#129353;")
        val rows = podium.mapIndexed { i, e -> podiumRow(i + 1, medals.getOrNull(i) ?: "", e) }.joinToString("\n")
        return """
<tr><td style="padding:8px 0;">
  ${card(
            """
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:$SLATE_500;">Global top 3</td>
      <td align="right" style="font-size:12px;color:$SLATE_400;">The Predictaball podium</td>
    </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
      $rows
    </table>
    """,
        )}
</td></tr>
"""
    }

    private fun podiumRow(rank: Int, medal: String, e: PodiumEntry): String {
        // If this row is the recipient, tint the background so it pops
        // without needing a separate hero-level "your rank" restatement.
        val rowBg = if (e.isMe) "background:linear-gradient(90deg,rgba(59,130,246,0.10),rgba(94,234,212,0.10));" else ""
        val nameColor = if (e.isMe) SLATE_900 else SLATE_700
        val meBadge = if (e.isMe) """<span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:9999px;background:#0f172a;color:#ffffff;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">You</span>""" else ""
        val topBorder = if (rank == 1) "" else "border-top:1px solid $SLATE_200;"
        return """
      <tr>
        <td style="padding:12px 4px;$topBorder$rowBg">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="10%" align="center" style="vertical-align:middle;font-size:20px;font-weight:900;">$medal</td>
              <td width="18%" align="left" style="vertical-align:middle;">${flag(e.flagCode, e.countryName, 32)}</td>
              <td align="left" style="vertical-align:middle;padding-left:6px;">
                <div style="font-size:14px;font-weight:800;color:$nameColor;letter-spacing:-0.01em;">${escape(e.firstName)} ${escape(e.familyName)}$meBadge</div>
                <div style="margin-top:2px;font-size:11px;color:$SLATE_500;">${escape(e.countryName)}</div>
              </td>
              <td align="right" style="vertical-align:middle;font-size:16px;font-weight:900;color:$SLATE_900;tabular-nums:1;">${e.points}<span style="font-size:11px;font-weight:700;color:$SLATE_500;"> pts</span></td>
            </tr>
          </table>
        </td>
      </tr>
        """
    }

    private fun renderClosing(): String = """
<tr><td style="padding:24px 0 8px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid $SLATE_200;border-radius:20px;">
    <tr><td align="center" style="padding:28px 24px;">
      <div style="font-size:20px;font-weight:900;letter-spacing:-0.01em;color:$SLATE_900;">See you at Euro 2028.</div>
      <div style="margin-top:10px;font-size:14px;color:$SLATE_500;line-height:1.55;max-width:400px;margin-left:auto;margin-right:auto;">
        We'll be back for the Euros. Thanks for spending the last month calling scores with us.
      </div>
      <div style="margin-top:16px;font-size:13px;font-weight:700;letter-spacing:0.02em;color:$SLATE_700;">&mdash; Ali &amp; Luke</div>
    </td></tr>
  </table>
</td></tr>
"""

    private fun renderFooter(): String = """
<tr><td style="padding:24px 12px 0;text-align:center;">
  <div style="font-size:11px;color:$SLATE_400;">
    Predictaball &middot; <a href="https://predictaball.live" style="color:$CYAN_600;text-decoration:none;">predictaball.live</a>
  </div>
</td></tr>
"""

    // A rounded surface card that mirrors the app's SurfaceCard component.
    private fun card(inner: String): String = """
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid $SLATE_200;border-radius:20px;">
  <tr><td style="padding:20px 22px;">
    $inner
  </td></tr>
</table>
"""

    private fun flag(code: String, name: String, sizePx: Int = 40): String {
        // flagcdn.com supports 40px+ widths sharp for retina display. Fallback
        // alt text keeps it readable in image-blocking clients.
        val safeCode = code.lowercase().replace(Regex("[^a-z0-9-]"), "")
        val w = sizePx
        val h = (sizePx * 3 + 3) / 4 // 4:3 aspect
        return """<img src="https://flagcdn.com/w80/$safeCode.png" alt="${escape(name)}" width="$w" height="$h" style="border-radius:6px;display:inline-block;">"""
    }

    // Short display name mirrors frontend SHORT_COUNTRY_NAMES for the common
    // long-form ones; falls back to the full name for anything not in the map.
    private fun shortName(name: String): String {
        val lower = name.lowercase()
        return when (lower) {
            "united states" -> "USA"
            "bosnia and herzegovina" -> "Bosnia"
            "czech republic" -> "Czechia"
            "dr congo" -> "DR Congo"
            else -> name.replaceFirstChar { it.titlecase() }
        }
    }

    private fun escape(s: String): String = s
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
}
