export default function YourHistory(): React.JSX.Element {
    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-5 py-2 text-sm font-semibold text-cyan-600 hover:bg-cyan-500/20 hover:border-cyan-500/40 dark:bg-cyan-400/10 dark:border-cyan-400/20 dark:text-cyan-300 dark:hover:bg-cyan-400/20 dark:hover:border-cyan-400/40 transition-colors">
            Your prediction history
            <span aria-hidden>→</span>
        </span>
    )
}
