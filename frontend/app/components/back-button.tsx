'use client'

import {Button} from "@nextui-org/react"
import {BRAND_GHOST_BUTTON_CLASS} from "@/app/util/css-classes"
import {BackIcon} from "@/app/util/back"
import React from "react"
import {useRouter} from "next/navigation";

export default function BackButton(): React.JSX.Element {

    const router = useRouter()

    return (
        <Button isIconOnly aria-label="Back to app" radius="full" className={BRAND_GHOST_BUTTON_CLASS} onPress={() => router.push("/app")}>
            <BackIcon/>
        </Button>
    )
}