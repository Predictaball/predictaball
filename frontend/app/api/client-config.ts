'use server'

import { Configuration, Middleware, ResponseContext } from "@/client"
import { API_GATEWAY } from "@/app/api/constants"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

const unauthorizedRedirect: Middleware = {
    async post(context: ResponseContext): Promise<Response> {
        if (context.response.status === 401) {
            redirect("/login")
        }
        return context.response
    }
}

export async function getConfigWithAuthHeader(): Promise<Configuration> {
    const session = await auth()
    const token = session?.backendToken

    return new Configuration({
        basePath: API_GATEWAY,
        headers: {
            "Authorization": token ?? ""
        },
        middleware: [unauthorizedRedirect],
    })
}
