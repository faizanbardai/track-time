import { useEffect, useRef, useState } from 'react'
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  ALL_TAG_ID,
  DATA_CHANGED_EVENT,
  listEventsByTag,
  listUpcomingEvents,
  listTags,
  reorderEventsInTag,
  UPCOMING_TAG_ID,
} from '../../helpers/indexedDB'
import { EventWithTags, Tag } from '../../types/event'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { useRouter } from 'next/navigation'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { PATHS } from '@/constants/paths'
import { useActiveTag } from '@/components/Event/useActiveTag'
import { useEventListClock } from '@/components/Event/EventListClock'
import { filterUpcomingEvents } from '@/helpers/eventViews'
import { useLoadingActions } from '@/components/providers/loading'

const UPCOMING_TAG: Tag = {
  id: UPCOMING_TAG_ID,
  name: 'Upcoming',
  system: true,
  createdAt: '',
  updatedAt: '',
}

const listEventsForTag = (tagId: string) => {
  return tagId === UPCOMING_TAG_ID
    ? listUpcomingEvents()
    : listEventsByTag(tagId)
}

export const useListEvents = () => {
  const router = useRouter()
  const { dbReady } = useIndexedDB()
  const { startLoading, stopLoading } = useLoadingActions()
  const now = useEventListClock()

  const [eventsByTag, setEventsByTag] = useState<
    Record<string, EventWithTags[]>
  >({})
  const eventsByTagRef = useRef<Record<string, EventWithTags[]>>({})
  const [tags, setTags] = useState<Tag[]>([])
  const [loadedTagId, setLoadedTagId] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const {
    activeTagId,
    selectionReady,
    selectTag: persistActiveTag,
  } = useActiveTag(tags)
  const loadedEvents = eventsByTag[activeTagId] ?? []
  const events =
    activeTagId === UPCOMING_TAG_ID
      ? filterUpcomingEvents(loadedEvents, now)
      : loadedEvents

  useEffect(() => {
    if (!dbReady) return

    startLoading()
    listTags()
      .then((loadedTags) =>
        setTags([
          ...loadedTags.slice(0, 1),
          UPCOMING_TAG,
          ...loadedTags.slice(1),
        ]),
      )
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
      .finally(stopLoading)
  }, [dbReady, startLoading, stopLoading])

  useEffect(() => {
    const refreshEvents = () => {
      eventsByTagRef.current = {}
      setEventsByTag({})
      setLoadedTagId(null)
      setLoading(true)
      setRefreshVersion((version) => version + 1)
    }

    window.addEventListener(DATA_CHANGED_EVENT, refreshEvents)
    return () => window.removeEventListener(DATA_CHANGED_EVENT, refreshEvents)
  }, [])

  useEffect(() => {
    if (!dbReady || !selectionReady) return

    let cancelled = false
    const activeIndex = tags.findIndex(({ id }) => id === activeTagId)
    const adjacentTagIds = [
      tags[activeIndex - 1]?.id,
      tags[activeIndex + 1]?.id,
    ]
      .filter((tagId): tagId is string => Boolean(tagId))
      .filter((tagId) => !(tagId in eventsByTagRef.current))

    const cacheEvents = (tagId: string, loadedEvents: EventWithTags[]) => {
      eventsByTagRef.current = {
        ...eventsByTagRef.current,
        [tagId]: loadedEvents,
      }
      setEventsByTag(eventsByTagRef.current)
    }

    const cachedEvents = eventsByTagRef.current[activeTagId]
    if (cachedEvents) {
      setLoadedTagId(activeTagId)
      setLoading(false)
    } else {
      setLoading(true)
      startLoading()
      listEventsForTag(activeTagId)
        .then((loadedEvents) => {
          if (cancelled) return
          cacheEvents(activeTagId, loadedEvents)
          setLoadedTagId(activeTagId)
        })
        .catch((err) => {
          if (!cancelled) setError(err.message)
        })
        .finally(() => {
          stopLoading()
          if (!cancelled) setLoading(false)
        })
    }

    adjacentTagIds.forEach((tagId) => {
      listEventsForTag(tagId)
        .then((loadedEvents) => {
          if (!cancelled) cacheEvents(tagId, loadedEvents)
        })
        .catch((err) => {
          if (!cancelled) setError(err.message)
        })
    })

    return () => {
      cancelled = true
    }
  }, [
    activeTagId,
    dbReady,
    refreshVersion,
    selectionReady,
    startLoading,
    stopLoading,
    tags,
  ])

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
    setLoading(!(tagId in eventsByTagRef.current))
    persistActiveTag(tagId)
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = events.findIndex((e) => String(e.id) === active.id)
    const newIndex = events.findIndex((e) => String(e.id) === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    setEventsByTag((eventsByTag) => {
      const items = eventsByTag[activeTagId] ?? []
      const ordered = arrayMove(items, oldIndex, newIndex)
      const nextEventsByTag = { ...eventsByTag, [activeTagId]: ordered }
      eventsByTagRef.current = nextEventsByTag
      reorderEventsInTag(
        activeTagId,
        ordered.map((e) => e.id),
      ).catch((err) => {
        setError(err.message)
      })
      return nextEventsByTag
    })
  }

  return {
    activeTagId,
    events,
    eventsByTag,
    initialLoading: loading && loadedTagId === null,
    tagLoading: loading && loadedTagId !== null,
    error,
    sensors,
    tags,
    selectTag,
    canReorder: activeTagId !== UPCOMING_TAG_ID,
    handleDragEnd,
  }
}
