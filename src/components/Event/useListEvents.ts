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
import { useActiveTag } from '@/components/Event/useActiveTag'

export const useListEvents = () => {
  const router = useRouter()
  const { dbReady } = useIndexedDB()

  const [events, setEvents] = useState<EventWithTags[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loadedTagId, setLoadedTagId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const {
    activeTagId,
    selectionReady,
    selectTag: persistActiveTag,
  } = useActiveTag(tags)

  useEffect(() => {
    if (!dbReady) return

    listTags()
      .then(setTags)
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [dbReady])

  useEffect(() => {
    if (!dbReady || !selectionReady) return

    let cancelled = false
    setLoading(true)
    listEventsByTag(activeTagId)
      .then((loadedEvents) => {
        if (cancelled) return
        setEvents(loadedEvents)
        setLoadedTagId(activeTagId)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeTagId, dbReady, selectionReady])

  useEffect(() => {
    if (
      dbReady &&
      !loading &&
      loadedTagId === activeTagId &&
      activeTagId === ALL_TAG_ID &&
      events.length === 0
    ) {
      router.push(PATHS.EVENT)
    }
  }, [activeTagId, dbReady, events.length, loadedTagId, loading, router])

  const selectTag = (tagId: string) => {
    setLoading(true)
    persistActiveTag(tagId)
  }

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
    initialLoading: loading && loadedTagId === null,
    tagLoading: loading && loadedTagId !== null,
    error,
    sensors,
    tags,
    selectTag,
    handleDragEnd,
  }
}
