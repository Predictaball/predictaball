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
