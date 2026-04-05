'use server'

import { cookies } from "next/headers";
import {Configuration} from "@/client";
import {API_GATEWAY} from "@/app/api/constants";
import {TOKEN_COOKIE_KEY} from "@/app/api/api";
import {jwtDecode} from "jwt-decode";

export async function getConfigWithAuthHeader(): Promise<Configuration> {
    let token: string | undefined = (await cookies()).get(TOKEN_COOKIE_KEY)?.value

    if (token && isTokenExpired(token)) {
        token = undefined
    }

    return new Configuration({
        basePath: API_GATEWAY,
        headers: {
            "Authorization": token ?? ""
        }
    })
}

function isTokenExpired(token: string): boolean {
    try {
        const decoded = jwtDecode(token)
        return decoded.exp ? decoded.exp * 1000 < Date.now() : true
    } catch {
        return true
    }
}