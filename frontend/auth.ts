import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import { decodeJwt } from "jose"
import { API_GATEWAY } from "@/app/api/constants"

const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? ""

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isProtected = nextUrl.pathname.startsWith("/app")
            if (isProtected && !isLoggedIn) {
                const loginUrl = new URL("/login", nextUrl)
                loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
                return Response.redirect(loginUrl)
            }
            return true
        },
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const [firstName, ...rest] = (user.name ?? "User").split(" ")
                const familyName = rest.join(" ") || ""
                try {
                    const res = await fetch(`${API_GATEWAY}/user/oauth`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Api-Key": ADMIN_API_KEY,
                        },
                        body: JSON.stringify({
                            userId: `google_${account.providerAccountId}`,
                            email: user.email,
                            firstName,
                            familyName,
                        }),
                    })
                    if (!res.ok) {
                        console.error("Failed to create OAuth member:", await res.text())
                        return false
                    }
                    const data = await res.json()
                    user.backendToken = data.idToken
                    user.refreshToken = data.refreshToken
                    user.isAdmin = data.isAdmin ?? false
                    user.id = data.userId
                } catch (e) {
                    console.error("OAuth member creation error:", e)
                    return false
                }
            }
            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.backendToken = user.backendToken
                token.refreshToken = user.refreshToken
                token.isAdmin = user.isAdmin ?? false
                token.userId = user.id
            }

            // Refresh backend token if expired
            if (token.backendToken) {
                try {
                    const { exp } = decodeJwt(token.backendToken)
                    const expiringWithinFiveMinutes = (exp ?? 0) * 1000 - Date.now() < 5 * 60_000
                    if (expiringWithinFiveMinutes && token.refreshToken) {
                        const res = await fetch(`${API_GATEWAY}/auth/refresh`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ refreshToken: token.refreshToken }),
                        })
                        if (res.ok) {
                            const data = await res.json()
                            token.backendToken = data.idToken
                            if (data.refreshToken) token.refreshToken = data.refreshToken
                        }
                    }
                } catch {
                    // If refresh fails, keep existing token
                }
            }

            return token
        },
        async session({ session, token }) {
            session.user.id = token.userId as string
            session.backendToken = token.backendToken
            session.isAdmin = token.isAdmin ?? false
            return session
        },
    },
    providers: [
        Google,
        Credentials({
            credentials: {
                email: { type: "email" },
                password: { type: "password" },
            },
            async authorize(credentials) {
                const res = await fetch(`${API_GATEWAY}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                    }),
                })
                if (!res.ok) return null
                const data = await res.json()
                return {
                    id: data.userId,
                    email: credentials.email as string,
                    backendToken: data.idToken,
                    refreshToken: data.refreshToken,
                    isAdmin: data.isAdmin ?? false,
                }
            },
        }),
    ],
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
