'use client'

import { Button } from '@/components/ui/button'
import { OfflineAwareLink } from '@/components/OfflineAwareLink'
import { EventDetails } from '@/components/Event/EventDetails'
import { getOfflineEventId } from '@/helpers/offlineRoute'
import { useEffect, useState, type ReactNode } from 'react'

export default function OfflinePage() {
  const [eventId, setEventId] = useState<string | null>(null)
  const [routeResolved, setRouteResolved] = useState(false)

  useEffect(() => {
    setEventId(getOfflineEventId(window.location.pathname))
    setRouteResolved(true)
  }, [])

  if (!routeResolved) return <main aria-busy="true" />

  if (eventId) {
    return (
      <EventDetails
        eventId={eventId}
        unavailableFallback={
          <OfflineNotice>
            This event is not available on this device. Reconnect to load it.
          </OfflineNotice>
        }
      />
    )
  }

  return <OfflineNotice />
}

const OfflineNotice = ({ children }: { children?: ReactNode }) => {
  return (
    <main className="grid content-start justify-items-start gap-3 py-12">
      <h1 className="text-2xl font-semibold">You’re offline</h1>
      <p className="max-w-prose text-muted-foreground">
        {children ??
          'Reconnect to load this page. Previously cached parts of Time Tracker and your locally stored entries remain available on this device.'}
      </p>
      <Button asChild>
        <OfflineAwareLink href="/">Try again</OfflineAwareLink>
      </Button>
    </main>
  )
}
