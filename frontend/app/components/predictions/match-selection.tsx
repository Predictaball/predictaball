'use client'

import React, {createContext, useContext, useState} from "react"

interface MatchSelection {
    selectedId: string | undefined
    setSelectedId: (id: string) => void
}

const MatchSelectionContext = createContext<MatchSelection | null>(null)

export function MatchSelectionProvider({initialId, children}: {initialId?: string; children: React.ReactNode}): React.JSX.Element {
    const [selectedId, setSelectedId] = useState<string | undefined>(initialId)
    return (
        <MatchSelectionContext.Provider value={{selectedId, setSelectedId}}>
            {children}
        </MatchSelectionContext.Provider>
    )
}

export function useMatchSelection(): MatchSelection {
    const ctx = useContext(MatchSelectionContext)
    if (!ctx) throw new Error("useMatchSelection must be used within MatchSelectionProvider")
    return ctx
}
