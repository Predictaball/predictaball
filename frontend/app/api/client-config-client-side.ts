'use client'

import {AuthApi, Configuration, Middleware, ResponseContext} from "@/client";
import {API_GATEWAY} from "@/app/api/constants";
import {REFRESH_TOKEN_COOKIE_KEY, TOKEN_COOKIE_KEY} from "@/app/api/api";
import {getCookie, setCookie, deleteCookie} from "cookies-next";
import {jwtDecode} from "jwt-decode";

function isTokenExpired(token: string): boolean {
    try {
        const decoded = jwtDecode(token)
        return decoded.exp ? decoded.exp * 1000 < Date.now() : true
    } catch {
        return true
    }
}

async function refreshIdToken(): Promise<string | undefined> {
    const refreshToken = getCookie(REFRESH_TOKEN_COOKIE_KEY)
    if (!refreshToken) return undefined

    try {
        const authApi = new AuthApi(new Configuration({ basePath: API_GATEWAY }))
        const response = await authApi.refreshToken({ refreshTokenRequest: { refreshToken } })
        setCookie(TOKEN_COOKIE_KEY, response.idToken, { maxAge: 60 * 60 * 24 })
        return response.idToken
    } catch {
        return undefined
    }
}

const unauthorizedRedirect: Middleware = {
    async post(context: ResponseContext): Promise<Response> {
        if (context.response.status === 401) {
            deleteCookie(TOKEN_COOKIE_KEY)
            deleteCookie(REFRESH_TOKEN_COOKIE_KEY)
            window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
        }
        return context.response
    }
}

export async function getConfigWithAuthHeaderClient(): Promise<Configuration> {
    let token: string | undefined = getCookie(TOKEN_COOKIE_KEY)

    if (token && isTokenExpired(token)) {
        token = await refreshIdToken()
    }

    return new Configuration({
        basePath: API_GATEWAY,
        headers: {
            "Authorization": token ?? ""
        },
        middleware: [unauthorizedRedirect],
    })
}
