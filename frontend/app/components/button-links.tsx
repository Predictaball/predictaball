import React from "react";
import {Button} from "@nextui-org/react";
import {BUTTON_CLASS} from "@/app/util/css-classes";

export default function ButtonLinks(): React.JSX.Element {
    return (
        <div className="w-full flex-col justify-around text-white">
            <div className="flex justify-around w-full">
                <div className="flex">
                    <Button className={BUTTON_CLASS}>
                        1
                    </Button>
                </div>
                <div className="flex">
                    <Button className={BUTTON_CLASS}>
                        2
                    </Button>
                </div>
            </div>
            <div className="flex justify-around w-full mt-1.5">
                <Button className={BUTTON_CLASS}>
                    3
                </Button>
                <Button className={BUTTON_CLASS}>
                    4
                </Button>
            </div>
        </div>
    )
}