export function doesContainDigit(val: string): boolean {
    return /\d/.test(val)
}

export function doesContainLowerCase(val: string) : boolean {
    return /[a-z]/.test(val)
}