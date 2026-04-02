'use client'

import {Button} from "@nextui-org/react"
import {BUTTON_CLASS} from "@/app/util/css-classes"
import {BackIcon} from "@/app/util/back"
import React from "react"
import {useRouter} from "next/navigation";

export default function BackButton(): React.JSX.Element {

    const router = useRouter()

    return (
        <Button isIconOnly className={BUTTON_CLASS} onClick={() => {
            if (window.history?.length && window.history.length > 1) {
                router.back()
             } else {
                router.push("/app")
             }
        }}>
            <BackIcon/>
        </Button>
    )
}