'use client'

import { useEffect, useState } from 'react'
import CreateOrUpdateEvent from '@/components/Event/CreateOrUpdateEvent'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { useLoadingActions } from '@/components/providers/loading'
import { getCachedEvent, getEvent } from '@/helpers/indexedDB'
import type { EventWithTags } from '@/types/event'
import type { ReactNode } from 'react'

interface EventDetailsProps {
  eventId: string
  unavailableFallback?: ReactNode
}

export const EventDetails = (props: EventDetailsProps) => {
  return <EventDetailsContent key={props.eventId} {...props} />
}

const EventDetailsContent = ({
  eventId,
  unavailableFallback,
}: EventDetailsProps) => {
  const { dbReady, dbError } = useIndexedDB()
  const [event, setEvent] = useState<EventWithTags | null>(() =>
    getCachedEvent(eventId),
  )
  const [loading, setLoading] = useState(() => !getCachedEvent(eventId))
  const [error, setError] = useState<string | null>(null)
  const { startLoading, stopLoading } = useLoadingActions()

  useEffect(() => {
    if (!dbReady) return
    let cancelled = false

    startLoading()
    getEvent(eventId)
      .then((found) => {
        if (cancelled) return
        setEvent(found)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to fetch event')
        setLoading(false)
      })
      .finally(stopLoading)

    return () => {
      cancelled = true
    }
  }, [dbReady, eventId, startLoading, stopLoading])

  if (dbError || error) {
    return (
      <p role="alert" className="text-red-500">
        {error || `Local storage is unavailable: ${dbError}`}
      </p>
    )
  }
  if (loading) return <div aria-busy="true">Loading...</div>
  if (!event) return unavailableFallback ?? <div>Event not found</div>

  return <CreateOrUpdateEvent event={event} />
}
