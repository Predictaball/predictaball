'use client'

import { Suspense, useEffect, useState } from 'react'
import dateFormat from "dateformat";

function useHydration() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}

export function LocalTime({ date }: { date: Date }) {
  const hydrated = useHydration()
  return (
    <Suspense key={hydrated ? 'local' : 'utc'}>
      <p>
        {dateFormat(date, "ddd dd/mm - HH:MM")}
        {hydrated ? '' : ' (UTC)'}
      </p>
    </Suspense>
  )
}