import {cookies} from "next/headers";
import {TOKEN_COOKIE_KEY} from "@/app/api/api";
import {JwtPayload, jwtDecode} from "jwt-decode";

function getDecodedToken(token: string | undefined): JwtPayload & Record<string, string> | undefined {
    if (!token) return undefined
    try {
        return jwtDecode(token)
    } catch {
        return undefined
    }
}

export async function getUserId(): Promise<string | undefined> {
    const token = (await cookies()).get(TOKEN_COOKIE_KEY)?.value
    return getDecodedToken(token)?.sub
}

export async function getToken(): Promise<JwtPayload | undefined> {
    const token = (await cookies()).get(TOKEN_COOKIE_KEY)?.value
    return getDecodedToken(token)
}

export const isLoggedIn = async () => {
    const token = (await cookies()).get(TOKEN_COOKIE_KEY)?.value
    return getDecodedToken(token) !== undefined
}

export const isAdmin = async () => {
    const token = (await cookies()).get(TOKEN_COOKIE_KEY)?.value
    const decoded = getDecodedToken(token)
    return decoded?.["custom:isAdmin"] === "true"
}
