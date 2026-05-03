import Link from "next/link"
import { getUserId } from "@/app/auth/jwt-handler"
import YourHistory from "@/app/components/your-history"
import React from "react"

export default async function LinkToHistory(): Promise<React.JSX.Element> {
    const userId = await getUserId()

    return (
        <Link href={`/app/user/${userId}/history`}>
            <YourHistory />
        </Link>
    )
}
