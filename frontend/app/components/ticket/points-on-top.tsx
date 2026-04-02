import React from "react";
import {Prediction} from "@/client";
import { calculateResult, RESULT_TO_STYLE } from "../points/result-styles"

interface PointsOnTopProps {
    prediction: Prediction | undefined
}

export default function PointsOnTop(props: PointsOnTopProps) {

    const points = props.prediction?.points === undefined ? 0 : props.prediction.points
    
    return <div
        className="w-full absolute text-center mt-1 z-40"
        style={{
            visibility: props.prediction?.points === undefined ? "hidden" : "visible"
        }}>
        <span
            className="font-bold text-8xl inline-block text-transparent bg-clip-text"
            style={RESULT_TO_STYLE.get(calculateResult(points))}
        >
            {props.prediction?.points}
        </span>
    </div>
}