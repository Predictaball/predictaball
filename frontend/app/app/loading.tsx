export default function Loading() {
    return (
        <main className="bg-gray-900">
            <div className="w-full max-w-screen-lg mx-auto relative flex min-h-screen flex-col items-center">
                <p className="text-xl font-bold mt-4 text-white text-center">PREDICTABALL</p>
                <div className="flex flex-col items-center gap-4 mt-8 w-full px-5 animate-pulse">
                    <div className="h-20 w-full max-w-md bg-gray-800 rounded-lg" />
                    <div className="h-40 w-full max-w-md bg-gray-800 rounded-lg" />
                    <div className="h-40 w-full max-w-md bg-gray-800 rounded-lg" />
                </div>
            </div>
        </main>
    )
}
