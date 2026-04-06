import React from "react";

export function getClippedTextForTeam(url: string): React.CSSProperties {
    return {
        backgroundImage: "url('" + url + "')",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "transparent",
        fontSize: "4.5rem",
        width: "auto",
        height: "auto"
    }
}