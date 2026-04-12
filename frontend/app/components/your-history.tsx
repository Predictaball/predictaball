import { Button } from "@nextui-org/react"
import { BUTTON_CLASS } from "@/app/util/css-classes"

export default function YourHistory(): React.JSX.Element {
    return(
        <Button className={BUTTON_CLASS}>
            Your Prediction History
        </Button>
    )
}
