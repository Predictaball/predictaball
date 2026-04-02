export function filterWithContext<T>(arr: T[], condition: (element: T) => boolean, n: number): T[] {
    const index = arr.findIndex(condition);

    if (index === -1) {
        return arr.slice(0, Math.min(n, arr.length));
    }

    const start = Math.max(index - n, 0)
    const end = Math.min(index + n + 1, arr.length)

    return arr.slice(start, end)
}