'use client'

import { ListEvent } from '@/components/Event/ListEvent'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { fetchAllEvents } from '@/helpers/indexedDB'
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
      fetchAllEvents()
        .then(setEvents)
        .finally(() => setLoading(false))
    }
  }, [dbReady])

  useEffect(() => {
    if (dbReady && !loading && events.length === 0) {
      router.push('/event')
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
    <div className="grid grid-cols-1 gap-4 py-2">
      {events.map((event) => (
        <ListEvent key={event.id} event={event} />
      ))}
    </div>
  )
}
