'use client'

import { getSession } from "next-auth/react"

export async function getUserIdClient(): Promise<string | undefined> {
    const session = await getSession()
    return session?.user?.id
}
