import { auth } from "@/auth"

export async function getUserId(): Promise<string | undefined> {
    const session = await auth()
    return session?.user?.id
}

export async function getBackendToken(): Promise<string | undefined> {
    const session = await auth()
    return session?.backendToken
}

export const isLoggedIn = async () => {
    const session = await auth()
    return !!session?.user
}

export const isAdmin = async () => {
    const session = await auth()
    return session?.isAdmin === true
}
