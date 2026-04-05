import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/", "/login", "/signup", "/reset", "/info", "/api"]

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.next()
    }

    const token = request.cookies.get("authToken")?.value
    if (!token) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/app/:path*"],
}
