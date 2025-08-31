'use client'

import { useIndexedDB } from '@/components/providers/indexedDB'
import { Card } from '@/components/ui/card'
import { fetchEventsFromIndexedDB } from '@/helpers/indexedDB/fetchEventsFromIndexedDB'
import { Event } from '@/types/event'

import { useEffect, useState } from 'react'

export const ListEvents = () => {
  const [events, setEvents] = useState<Event[]>([])
  const { dbReady } = useIndexedDB()

  useEffect(() => {
    if (dbReady) {
      fetchEventsFromIndexedDB().then(setEvents)
    }
  }, [dbReady])

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
      {events.length === 0 ? (
        <div className="col-span-full text-center text-muted-foreground py-12">
          No events found.
        </div>
      ) : (
        events.map((event) => (
          <Card
            key={event.id}
            className="flex flex-col gap-2 p-6 shadow-lg border border-border bg-card hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold text-primary mb-1">
              {event.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block px-2 py-0.5 rounded bg-accent">
                {event.date}
              </span>
              <span className="inline-block px-2 py-0.5 rounded bg-accent">
                {event.time}
              </span>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
