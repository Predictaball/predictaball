'use client'

import { Configuration, Middleware, ResponseContext } from "@/client"
import { API_GATEWAY } from "@/app/api/constants"
import { getSession } from "next-auth/react"

const unauthorizedRedirect: Middleware = {
    async post(context: ResponseContext): Promise<Response> {
        if (context.response.status === 401) {
            window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
        }
        return context.response
    }
}

export async function getConfigWithAuthHeaderClient(): Promise<Configuration> {
    const session = await getSession()
    const token = session?.backendToken

    return new Configuration({
        basePath: API_GATEWAY,
        headers: {
            "Authorization": token ?? ""
        },
        middleware: [unauthorizedRedirect],
    })
}
