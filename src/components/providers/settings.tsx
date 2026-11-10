'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type TimeFormat = '12h' | '24h'

const TIME_FORMAT_KEY = 'track-time-time-format'
const SettingsContext = createContext<{
  timeFormat: TimeFormat
  setTimeFormat: (format: TimeFormat) => void
}>({ timeFormat: '24h', setTimeFormat: () => undefined })

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h')

  useEffect(() => {
    const saved = window.localStorage.getItem(TIME_FORMAT_KEY)
    if (saved === '12h' || saved === '24h') setTimeFormat(saved)
  }, [])

  const updateTimeFormat = (format: TimeFormat) => {
    setTimeFormat(format)
    window.localStorage.setItem(TIME_FORMAT_KEY, format)
  }

  return (
    <SettingsContext.Provider
      value={{ timeFormat, setTimeFormat: updateTimeFormat }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
