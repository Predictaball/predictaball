package scorcerer.utils

fun String.toTitleCase(): String {
    return this.split(" ").joinToString(" ") { word ->
        word.lowercase().replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
}

/**
 * Capitalise the first character of each space-separated word, leaving the rest
 * of the word untouched. Preserves intentional internal capitalisation (e.g.
 * `MacDonald`) and tolerates lowercase names from upstream providers (e.g.
 * Google passing through a `sunil singh` profile).
 */
fun String.capitaliseName(): String {
    return this.split(" ").joinToString(" ") { word ->
        word.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
}

/**
 * The country-league ID for a team name: the slugified name (e.g. "South Africa"
 * -> "south-africa"). This is the canonical place this rule lives — country
 * leagues are auto-created with this ID, and the rankings reference them by it.
 */
fun String.toCountryLeagueId(): String {
    return this.lowercase().replace(Regex("\\s+"), "-")
}
