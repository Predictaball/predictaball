export default function YourHistory(): React.JSX.Element {
    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-green-300 px-5 py-2 text-sm font-semibold text-gray-900 shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02]">
            Your prediction history
            <span aria-hidden>→</span>
        </span>
    )
}
