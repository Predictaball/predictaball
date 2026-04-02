'use client'

import {Configuration} from "@/client";
import {API_GATEWAY} from "@/app/api/constants";
import {TOKEN_COOKIE_KEY} from "@/app/api/api";
import {getCookie} from "cookies-next";

export async function getConfigWithAuthHeaderClient(): Promise<Configuration> {
    const token: string | undefined = getCookie(TOKEN_COOKIE_KEY)
    const validatedToken: string = token ? token : ""
    return new Configuration({
        basePath: API_GATEWAY + '/prod',
        headers: {
            "Authorization": validatedToken
        }
    })
}