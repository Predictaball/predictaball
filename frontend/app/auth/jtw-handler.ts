import {cookies} from "next/headers";
import {TOKEN_COOKIE_KEY} from "@/app/api/api";
import {jwtDecode} from "jwt-decode";
import {CognitoJwtVerifier} from "aws-jwt-verify";
import { JwtPayload } from "aws-jwt-verify/jwt-model"

export function getUserId(): string | undefined {
    try {
        const token: string | undefined = cookies().get(TOKEN_COOKIE_KEY)?.value
        if (token === undefined) {
            return undefined
        }
        return jwtDecode(token).sub
    } catch (error) {
        console.log(error)
        return undefined
    }
}

export function getToken(): JwtPayload | undefined {
    try {
        const token: string | undefined = cookies().get(TOKEN_COOKIE_KEY)?.value
        if (token === undefined) {
            return undefined
        }
        return jwtDecode(token)
    } catch (error) {
        console.log(error)
        return undefined
    }
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.COGNITO_CLIENT_ID!,
});

const getAuthPayload = async () => {
    const token: string | undefined = cookies().get(TOKEN_COOKIE_KEY)?.value
    if (token === undefined) throw new Error("Auth cookie does not exist")

    await verifier.hydrate()
    return await verifier.verify(token)
}

export const isLoggedIn = async () => {
    try {
        await getAuthPayload()
    } catch (error) {
        return false
    }
    return true
}

export const isAdmin = async () => {
    try {
        const payload = await getAuthPayload()
        return payload['custom:isAdmin'] === "true"
    } catch (error) {
        return false
    }
}