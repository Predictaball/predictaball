'use server'

import { cookies } from "next/headers";
import {Configuration, Middleware, ResponseContext} from "@/client";
import {API_GATEWAY} from "@/app/api/constants";
import {TOKEN_COOKIE_KEY} from "@/app/api/api";
import {jwtDecode} from "jwt-decode";
import {redirect} from "next/navigation";

function isTokenExpired(token: string): boolean {
    try {
        const decoded = jwtDecode(token)
        return decoded.exp ? decoded.exp * 1000 < Date.now() : true
    } catch {
        return true
    }
}

const unauthorizedRedirect: Middleware = {
    async post(context: ResponseContext): Promise<Response> {
        if (context.response.status === 401) {
            redirect("/login")
        }
        return context.response
    }
}

export async function getConfigWithAuthHeader(): Promise<Configuration> {
    let token: string | undefined = (await cookies()).get(TOKEN_COOKIE_KEY)?.value

    if (token && isTokenExpired(token)) {
        token = undefined
    }

    return new Configuration({
        basePath: API_GATEWAY,
        headers: {
            "Authorization": token ?? ""
        },
        middleware: [unauthorizedRedirect],
    })
}
