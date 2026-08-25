'use client'
import React from 'react'
import { useEffect, useState } from 'react'
import { EventWithTags } from '@/types/event'
import { getEvent } from '@/helpers/indexedDB'
import CreateOrUpdateEvent from '@/components/Event/CreateOrUpdateEvent'
import { useLoadingActions } from '@/components/providers/loading'

interface EventPageProps {
  params: Promise<{ eventId: string }>
}

const SingleEventPage = ({ params }: EventPageProps) => {
  const { eventId } = React.use(params)
  const [event, setEvent] = useState<EventWithTags | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { startLoading, stopLoading } = useLoadingActions()

  useEffect(() => {
    startLoading()
    getEvent(eventId)
      .then((found) => {
        setEvent(found || null)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Failed to fetch event')
        setLoading(false)
      })
      .finally(stopLoading)
  }, [eventId, startLoading, stopLoading])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!event) return <div>Event not found</div>

  return <CreateOrUpdateEvent event={event} />
}

export default SingleEventPage
