import React, { Suspense } from "react";
import Headline from "@/app/components/points/headline";
import DefaultCards from "@/app/components/points/default-cards";

export default function HeadlineSuspense(): React.JSX.Element {
    return (
        
            <Suspense fallback={<DefaultCards />}>
                <Headline />
            </Suspense>
    )
}