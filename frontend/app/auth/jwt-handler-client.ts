'use client'

import {getCookie} from "cookies-next";
import {TOKEN_COOKIE_KEY} from "@/app/api/api";
import {jwtDecode} from "jwt-decode";

export function getUserIdClient(): string | undefined {
    'use client'
    try {
        const token: string | undefined = getCookie(TOKEN_COOKIE_KEY)
        if (token === undefined) {
            return undefined
        }
        return jwtDecode(token)?.sub
    } catch (error) {
        return undefined
    }
}