'use server'

import { cookies } from "next/headers";
import {Configuration} from "@/client";
import {API_GATEWAY} from "@/app/api/constants";
import {TOKEN_COOKIE_KEY} from "@/app/api/api";

export async function getConfigWithAuthHeader(): Promise<Configuration> {
    const token: string | undefined = cookies().get(TOKEN_COOKIE_KEY)?.value
    const validatedToken: string = token ? token : ""
    return new Configuration({
        basePath: API_GATEWAY + '/prod',
        headers: {
            "Authorization": validatedToken
        }
    })
}