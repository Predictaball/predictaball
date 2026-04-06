'use client'

import { Button } from "@nextui-org/react"
import { BUTTON_CLASS } from "@/app/util/css-classes"
import { useState } from "react"

export default function YourHistory(): React.JSX.Element {

    const [isLoading, setIsLoading] = useState(false)

    return(
            <Button
                className={BUTTON_CLASS}
                isLoading={isLoading}
                onPress={() => setIsLoading(true)}
            >
                Your Prediction History
            </Button>
    )
} 