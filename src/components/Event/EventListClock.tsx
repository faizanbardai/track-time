'use client'

import dayjs, { Dayjs } from 'dayjs'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

const EventListClockContext = createContext<Dayjs | null>(null)

export const EventListClock = ({ children }: { children: ReactNode }) => {
  const [now, setNow] = useState(() => dayjs())

  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <EventListClockContext.Provider value={now}>
      {children}
    </EventListClockContext.Provider>
  )
}

export const useEventListClock = () => {
  const now = useContext(EventListClockContext)

  if (!now) {
    throw new Error('useEventListClock must be used within EventListClock')
  }

  return now
}
