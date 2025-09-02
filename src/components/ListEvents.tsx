'use client'

import { Counter } from '@/components/Counter'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { Card } from '@/components/ui/card'
import { fetchEventsFromIndexedDB } from '@/helpers/indexedDB/fetchEventsFromIndexedDB'
import { Event } from '@/types/event'
import { useRouter } from 'next/navigation'

import { useEffect, useState } from 'react'

export const ListEvents = () => {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { dbReady } = useIndexedDB()

  useEffect(() => {
    if (dbReady) {
      setLoading(true)
      fetchEventsFromIndexedDB()
        .then(setEvents)
        .finally(() => setLoading(false))
    }
  }, [dbReady])

  useEffect(() => {
    if (dbReady && !loading && events.length === 0) {
      router.push('/create')
    }
  }, [dbReady, loading, events.length, router])

  if (loading) {
    return (
      <div className="col-span-full text-center text-muted-foreground py-12">
        Loading events...
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
      {events.map((event) => (
        <Card
          key={event.id}
          className="flex flex-col gap-2 p-6 shadow-lg border border-border bg-card hover:shadow-xl transition-shadow"
        >
          <h3 className="text-lg font-semibold text-primary mb-1">
            {event.title}
          </h3>
          <Counter eventDatetime={event.datetime} />
        </Card>
      ))}
    </div>
  )
}
