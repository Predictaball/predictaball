import React from "react"
import Image from "next/image"
import styles from "@/app/styles/Flag.module.css"
import {getFlagUrl} from "@/app/util/flag";

interface FlagAnimatedProps {
    flagCode: string
}

export default function FlagAnimated(props: FlagAnimatedProps): React.JSX.Element {

    return (
        <div className={'flex-shrink-0 mx-4'}>
            <Image
                alt="flag"
                src={getFlagUrl(props.flagCode)}
                width={80}
                height={53}
                className={styles.flag}
            />
        </div>
    )
}
