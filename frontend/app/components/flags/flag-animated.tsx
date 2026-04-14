import React from "react"
import Image from "next/image"
import styles from "@/app/styles/Flag.module.css"
import {getFlagUrl} from "@/app/util/flag";

interface FlagAnimatedProps {
    index: number,
    invert: boolean,
    bottom: string,
    flagCode: string
}

export default function FlagAnimated(props: FlagAnimatedProps): React.JSX.Element {

    const animationStyle = {
        animationDelay: `${props.index * -1000}ms`,
        animationDirection: props.invert ? "reverse" : "normal",
        bottom: props.bottom
    };

    return (
        <div className={'z-0 absolute lg:animate-slideslow animate-slide overflow-hidden invisible'} style={animationStyle}>
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
