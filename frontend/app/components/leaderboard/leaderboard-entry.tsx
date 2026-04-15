import React from "react";
import {LeaderboardInner, LeaderboardInnerMovementEnum} from "@/client";
import {DOWN_ARROW, NEUTRAL_ARROW, UP_ARROW} from "@/app/components/leaderboard/icons";
import Link from "next/link"
import {generateHistoryPageLinkForUser} from "@/app/app/user/[userId]/history/user-link-generator";
import Entry from "@/app/components/leaderboard/entry";

interface LeaderboardEntryProps {
    entry: LeaderboardInner,
    isUser: boolean,
    disablePulse: boolean
}

const MOVEMENT_TO_ICON: Record<LeaderboardInnerMovementEnum, React.JSX.Element> = {
    UNCHANGED: NEUTRAL_ARROW,
    WORSENED: DOWN_ARROW,
    IMPROVED: UP_ARROW,
}

export default function LeaderboardEntry(props: LeaderboardEntryProps): React.JSX.Element {
    return (
        <Link className="max-w-2xl w-full" href={generateHistoryPageLinkForUser(props.entry.user)}>
            <Entry
                entry={props.entry}
                icon={MOVEMENT_TO_ICON[props.entry.movement]}
                movement={props.entry.movement}
                disablePulse={props.disablePulse}
                isUser={props.isUser}
            />
        </Link>
    )
}
