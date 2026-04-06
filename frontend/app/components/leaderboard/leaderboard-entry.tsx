import React from "react";
import {LeaderboardInner, LeaderboardInnerMovementEnum} from "@/client";
import {DOWN_ARROW, NEUTRAL_ARROW, UP_ARROW} from "@/app/components/leaderboard/icons";
import Link from "next/link"
import {failStyle, neutralStyle, successStyle} from "@/app/util/css-styles";
import {generateHistoryPageLinkForUser} from "@/app/app/user/[userId]/history/user-link-generator";
import Entry from "@/app/components/leaderboard/entry";

interface LeaderboardEntryProps {
    entry: LeaderboardInner,
    isUser: boolean,
    disablePulse: boolean
}

export default function LeaderboardEntry(props: LeaderboardEntryProps): React.JSX.Element {

    const scale = props.entry.position === 1 ? 1 : props.isUser ? 0.95 : 0.90

    const MOVEMENT_TO_COLOR: Map<LeaderboardInnerMovementEnum, React.CSSProperties> = new Map([
        [LeaderboardInnerMovementEnum.Improved, {...successStyle, scale: scale}],
        [LeaderboardInnerMovementEnum.Worsened, {...failStyle, scale: scale}],
        [LeaderboardInnerMovementEnum.Unchanged, {...neutralStyle, scale: scale}]
    ])
    const MOVEMENT_TO_ICON: Map<LeaderboardInnerMovementEnum, React.JSX.Element> = new Map([
        [LeaderboardInnerMovementEnum.Unchanged, NEUTRAL_ARROW],
        [LeaderboardInnerMovementEnum.Worsened, DOWN_ARROW],
        [LeaderboardInnerMovementEnum.Improved, UP_ARROW]
    ])

    return (
        <Link 
            className="max-w-2xl w-full"
            href={generateHistoryPageLinkForUser(props.entry.user)}
        >
            <Entry
                entry={props.entry}
                color={MOVEMENT_TO_COLOR.get(props.entry.movement)!}
                icon={MOVEMENT_TO_ICON.get(props.entry.movement)!}
                disablePulse={props.disablePulse}
            />
        </Link>
    )
}