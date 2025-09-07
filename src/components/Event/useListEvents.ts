import { useEffect, useState } from 'react'
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { fetchAllEvents, setEventOrder } from '../../helpers/indexedDB'
import { Event } from '../../types/event'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { useRouter } from 'next/navigation'
import { arrayMove } from '@dnd-kit/sortable'
import { PATHS } from '@/constants/paths'

export const useListEvents = () => {
  const router = useRouter()
  const { dbReady } = useIndexedDB()

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (dbReady) {
      setLoading(true)
      fetchAllEvents()
        .then(setEvents)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [dbReady])

  useEffect(() => {
    if (dbReady && !loading && events.length === 0) {
      router.push(PATHS.EVENT)
    }
  }, [dbReady, loading, events.length, router])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id === over?.id) return

    const oldIndex = events.findIndex((e) => String(e.id) === active.id)
    const newIndex = events.findIndex((e) => String(e.id) === over?.id)
    setEvents((items) => {
      const ordered = arrayMove(items, oldIndex, newIndex)
      setEventOrder(ordered.map((e) => e.id))
      return ordered
    })
  }

  return { events, loading, error, sensors, handleDragEnd }
}
