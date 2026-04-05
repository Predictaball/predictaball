'use client'

import { jwtDecode } from "jwt-decode"
import { getCookie } from "cookies-next"
import { TOKEN_COOKIE_KEY } from "@/app/api/api"
import Link from "next/link"
import { Button } from "@nextui-org/react"
import { BUTTON_CLASS } from "@/app/util/css-classes"

export default function AdminButton() {
    const token = getCookie(TOKEN_COOKIE_KEY)
    if (!token) return null

    try {
        const decoded = jwtDecode<Record<string, string>>(token)
        if (decoded["custom:isAdmin"] !== "true") return null
    } catch {
        return null
    }

    return (
        <div className="absolute left-4 top-3">
            <Link href="/app/admin"><Button size="sm" className={BUTTON_CLASS}>Admin</Button></Link>
        </div>
    )
}
