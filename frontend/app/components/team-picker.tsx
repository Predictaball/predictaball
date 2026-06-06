'use client'

import React, { useEffect, useState } from "react"
import { Autocomplete, AutocompleteItem } from "@nextui-org/react"
import { Configuration, Team, TeamApi } from "@/client"
import { API_GATEWAY } from "@/app/api/constants"
import { FlagImage } from "@/app/components/predictions/flag-image"
import { AUTH_INPUT_CLASS_NAMES } from "@/app/util/css-classes"

// GET /team is public, so no auth header is needed here.
const teamApi = new TeamApi(new Configuration({ basePath: API_GATEWAY }))

interface TeamPickerProps {
    value: string | null
    onSelect: (teamId: string | null) => void
    label?: string
}

export default function TeamPicker({ value, onSelect, label = "Who are you supporting?" }: TeamPickerProps): React.JSX.Element {
    const [teams, setTeams] = useState<Team[]>([])

    useEffect(() => {
        teamApi.getTeams()
            .then(t => setTeams([...t].sort((a, b) => a.teamName.localeCompare(b.teamName))))
            .catch(() => setTeams([]))
    }, [])

    return (
        <Autocomplete
            label={label}
            variant="bordered"
            selectedKey={value}
            onSelectionChange={(key) => onSelect(key ? key.toString() : null)}
            inputProps={{ classNames: AUTH_INPUT_CLASS_NAMES }}
            defaultItems={teams}
        >
            {(team) => (
                <AutocompleteItem
                    key={team.teamId}
                    textValue={team.teamName}
                    startContent={<FlagImage code={team.flagCode} name={team.teamName} size={24} />}
                >
                    {team.teamName}
                </AutocompleteItem>
            )}
        </Autocomplete>
    )
}
