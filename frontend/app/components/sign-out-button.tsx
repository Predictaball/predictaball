'use client'

import { Button } from "@nextui-org/react"
import { GHOST_BUTTON_CLASS } from "@/app/util/css-classes"
import React from "react"
import { signOut } from "next-auth/react"

export default function SignOutButton(): React.JSX.Element {
    return (
        <Button size="sm" radius="full" onPress={() => signOut({ callbackUrl: "/" })} className={GHOST_BUTTON_CLASS}>
            Sign out
        </Button>
    )
}
