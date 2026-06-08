'use client'

import React from "react"
import { QRCodeSVG } from "qrcode.react"
import { inviteUrl } from "@/app/util/leagues"

interface InviteQRCodeProps {
    leagueId: string
    size?: number
}

// A scannable QR code encoding the league's invite link. Scanning it opens the
// same /league/[leagueId]/join page the "Invite" link points to. QR codes need a
// light background with dark modules to scan reliably, so we always render on
// white regardless of theme.
export default function InviteQRCode({ leagueId, size = 200 }: InviteQRCodeProps): React.JSX.Element {
    return (
        <div className="inline-flex rounded-2xl bg-white p-4 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5">
            <QRCodeSVG
                value={inviteUrl(leagueId)}
                size={size}
                level="M"
                marginSize={0}
                bgColor="#ffffff"
                fgColor="#0f172a"
                aria-label="QR code to join this league"
            />
        </div>
    )
}
