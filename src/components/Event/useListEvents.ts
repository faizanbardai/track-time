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
  ANNIVERSARY_TAG_ID,
  DATA_CHANGED_EVENT,
  listEventsByTag,
  listUpcomingEvents,
  listTags,
  reorderEventsInTag,
  UPCOMING_TAG_ID,
} from '../../helpers/indexedDB'
import { EventWithTags, Tag } from '../../types/event'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useActiveTag } from '@/components/Event/useActiveTag'
import { useEventListClock } from '@/components/Event/EventListClock'
import { getEventsForView } from '@/helpers/eventViews'
import { useLoadingActions } from '@/components/providers/loading'

const UPCOMING_TAG: Tag = {
  id: UPCOMING_TAG_ID,
  name: 'Upcoming',
  system: true,
  createdAt: '',
  updatedAt: '',
}

const ANNIVERSARY_TAG: Tag = {
  id: ANNIVERSARY_TAG_ID,
  name: 'Anniversary',
  system: true,
  createdAt: '',
  updatedAt: '',
}

export type EventSortMode = 'user' | 'asc' | 'desc'

const SORT_MODE_KEY = 'track-time:event-sort-mode:'
const defaultSortMode = (tagId: string): EventSortMode =>
  tagId === ALL_TAG_ID ||
  tagId === UPCOMING_TAG_ID ||
  tagId === ANNIVERSARY_TAG_ID
    ? 'asc'
    : 'user'

const readSortMode = (tagId: string): EventSortMode => {
  if (typeof window === 'undefined') return defaultSortMode(tagId)
  const value = window.localStorage.getItem(`${SORT_MODE_KEY}${tagId}`)
  if (value === 'asc' || value === 'desc' || value === 'user') return value
  return defaultSortMode(tagId)
}

const listEventsForTag = (tagId: string) => {
  if (tagId === UPCOMING_TAG_ID) return listUpcomingEvents()
  const sourceTagId = tagId === ANNIVERSARY_TAG_ID ? ALL_TAG_ID : tagId
  const events = listEventsByTag(sourceTagId)
  return tagId === ALL_TAG_ID ? events.then(sortEventsByStartDate) : events
}

export const useListEvents = () => {
  const { dbReady, dbError } = useIndexedDB()
  const { startLoading, stopLoading } = useLoadingActions()
  const now = useEventListClock()

  const [eventsByTag, setEventsByTag] = useState<
    Record<string, EventWithTags[]>
  >({})
  const eventsByTagRef = useRef<Record<string, EventWithTags[]>>({})
  const [tags, setTags] = useState<Tag[]>([])
  const [loadedTagId, setLoadedTagId] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [sortModes, setSortModes] = useState<Record<string, EventSortMode>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const {
    activeTagId,
    selectionReady,
    selectTag: persistActiveTag,
  } = useActiveTag(tags)
  const loadedEvents = eventsByTag[activeTagId] ?? []
  const sortMode = sortModes[activeTagId] ?? defaultSortMode(activeTagId)
  const events = getEventsForView(
    loadedEvents,
    {
      upcoming: activeTagId === UPCOMING_TAG_ID,
      anniversary: activeTagId === ANNIVERSARY_TAG_ID,
      sortMode,
    },
    now,
  )

  useEffect(() => {
    if (dbError) {
      setError(`Local storage is unavailable: ${dbError}`)
      setLoading(false)
      return
    }
    if (!dbReady) return

    startLoading()
    listTags()
      .then((loadedTags) => {
        setTags([
          ...loadedTags.slice(0, 1),
          UPCOMING_TAG,
          ANNIVERSARY_TAG,
          ...loadedTags.slice(1),
        ])
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
      .finally(stopLoading)
  }, [dbError, dbReady, startLoading, stopLoading])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mode = readSortMode(activeTagId)
    setSortModes((modes) => ({ ...modes, [activeTagId]: mode }))
  }, [activeTagId])

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
    if (!dbReady || !selectionReady || dbError) return

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
          setError(null)
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
        .catch((err: unknown) => {
          if (!cancelled) {
            console.error('Unable to preload events for an adjacent tag', err)
          }
        })
    })

    return () => {
      cancelled = true
    }
  }, [
    activeTagId,
    dbReady,
    dbError,
    refreshVersion,
    selectionReady,
    startLoading,
    stopLoading,
    tags,
  ])

  const selectTag = (tagId: string) => {
    setLoading(!(tagId in eventsByTagRef.current))
    persistActiveTag(tagId)
  }

  const toggleSortMode = () => {
    const current = sortModes[activeTagId] ?? defaultSortMode(activeTagId)
    const next: EventSortMode =
      activeTagId === ALL_TAG_ID ||
      activeTagId === UPCOMING_TAG_ID ||
      activeTagId === ANNIVERSARY_TAG_ID
        ? current === 'asc'
          ? 'desc'
          : 'asc'
        : current === 'user'
          ? 'asc'
          : current === 'asc'
            ? 'desc'
            : 'user'
    setSortModes((modes) => ({ ...modes, [activeTagId]: next }))
    window.localStorage.setItem(`${SORT_MODE_KEY}${activeTagId}`, next)
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
    initialLoading: loading && loadedTagId === null && !dbError,
    tagLoading: loading && loadedTagId !== null,
    error,
    sensors,
    tags,
    selectTag,
    canReorder:
      activeTagId !== ALL_TAG_ID &&
      activeTagId !== UPCOMING_TAG_ID &&
      activeTagId !== ANNIVERSARY_TAG_ID &&
      sortMode === 'user',
    handleDragEnd,
    sortMode,
    sortModes,
    getSortMode: (tagId: string) => sortModes[tagId] ?? readSortMode(tagId),
    toggleSortMode,
  }
}
