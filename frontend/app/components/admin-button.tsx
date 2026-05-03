'use client'

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@nextui-org/react"
import { GHOST_BUTTON_CLASS } from "@/app/util/css-classes"

export default function AdminButton() {
    const { data: session } = useSession()
    if (!session?.isAdmin) return null

    return (
        <Link href="/app/admin">
            <Button size="sm" radius="full" className={GHOST_BUTTON_CLASS}>
                Admin
            </Button>
        </Link>
    )
}
