import Link from "next/link"
import { getToken, getUserId } from "@/app/auth/jtw-handler"
import YourHistory from "@/app/components/your-history"
import React from "react";

export default async function LinkToHistory(): Promise<React.JSX.Element> {

    const token = await getToken()
    const userId = token?.sub

    return(
        <Link href={`/app/user/${userId}/history`}>
            <YourHistory />
        </Link>
    )
}