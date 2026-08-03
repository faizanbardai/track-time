import { useEffect, useState } from 'react'
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  ALL_TAG_ID,
  listEventsByTag,
  listTags,
  reorderEventsInTag,
} from '../../helpers/indexedDB'
import { EventWithTags, Tag } from '../../types/event'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { useRouter } from 'next/navigation'
import { arrayMove } from '@dnd-kit/sortable'
import { PATHS } from '@/constants/paths'

export const useListEvents = () => {
  const router = useRouter()
  const { dbReady } = useIndexedDB()

  const [events, setEvents] = useState<EventWithTags[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [activeTagId, setActiveTagId] = useState(ALL_TAG_ID)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (dbReady) {
      setLoading(true)
      Promise.all([listTags(), listEventsByTag(activeTagId)])
        .then(([loadedTags, loadedEvents]) => {
          setTags(loadedTags)
          setEvents(loadedEvents)
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [activeTagId, dbReady])

  useEffect(() => {
    if (
      dbReady &&
      !loading &&
      activeTagId === ALL_TAG_ID &&
      events.length === 0
    ) {
      router.push(PATHS.EVENT)
    }
  }, [activeTagId, dbReady, loading, events.length, router])

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
    if (!over || active.id === over.id) return

    const oldIndex = events.findIndex((e) => String(e.id) === active.id)
    const newIndex = events.findIndex((e) => String(e.id) === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    setEvents((items) => {
      const ordered = arrayMove(items, oldIndex, newIndex)
      reorderEventsInTag(
        activeTagId,
        ordered.map((e) => e.id),
      ).catch((err) => {
        setError(err.message)
      })
      return ordered
    })
  }

  return {
    activeTagId,
    events,
    loading,
    error,
    sensors,
    tags,
    setActiveTagId,
    handleDragEnd,
  }
}
