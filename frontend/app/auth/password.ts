export default function validatePassword(password: string): boolean {
    return password.length >= 6
        && containsDigit(password)
        && containsLowerCase(password)
}

function containsDigit(password: string) {
    return /\d/.test(password);
}

function containsLowerCase(password: string) {
    return password.toUpperCase() != password;
}
