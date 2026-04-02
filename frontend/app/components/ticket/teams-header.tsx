import {Match} from "@/client";
import PointsOnTop from "@/app/components/ticket/points-on-top";
import LivePulse from "@/app/components/ticket/live-pulse";
import {getClippedTextForTeam} from "@/app/components/ticket/clipped-text";
import {getFlagUrl} from "@/app/util/flag";
import {COUNTRY_CODES} from "@/app/util/teams";

interface TeamsHeaderProps {
    match: Match,
    showPoints: boolean
}

export default function TeamsHeader(props: TeamsHeaderProps) {
    return <div className="w-full relative">
        {props.showPoints && <PointsOnTop prediction={props.match.prediction}/>}
        <LivePulse matchState={props.match.state}/>
        <div className="flex justify-around"
             style={{opacity: props.match.prediction?.points === undefined ? "100%" : "50%"}}
        >
            <div className="content-center">
                <div style={getClippedTextForTeam(getFlagUrl(props.match.homeTeamFlagCode))}>
                    {COUNTRY_CODES[props.match.homeTeam.toLowerCase()]}
                </div>
            </div>
            <div className="content-center">
                <div style={getClippedTextForTeam(getFlagUrl(props.match.awayTeamFlagCode))}>
                    {COUNTRY_CODES[props.match.awayTeam.toLowerCase()]}
                </div>
            </div>
        </div>
    </div>
}