import React from "react";

export function getClippedTextForTeam(url: string): React.CSSProperties {
    return {
        backgroundImage: "url('" + url + "')",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        fontSize: "4.5rem",
        width: "auto",
        height: "auto"
        //WebkitTextStrokeColor: "black",
        //WebkitTextStrokeWidth: "0.1px",
    }
}