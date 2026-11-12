'use client'

import { useEffect, useState } from 'react'
import { PATHS } from '@/constants/paths'
import { getPageTitle, NAVIGATION_LABELS } from '@/constants/navigation'
import {
  db,
  getCachedEvent,
  getEvent,
  UPCOMING_TAG_ID,
} from '@/helpers/indexedDB'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { subscribeToActiveTagChange } from '@/lib/activeTagChange'

export const useHeaderBreadcrumb = (pathname: string) => {
  const { dbReady } = useIndexedDB()
  const eventId = pathname.startsWith(`${PATHS.EVENT}/`)
    ? pathname.slice(`${PATHS.EVENT}/`.length)
    : null
  const [eventTitle, setEventTitle] = useState<{
    eventId: string
    title: string
  } | null>(() => {
    const cachedEvent = eventId ? getCachedEvent(eventId) : null
    return cachedEvent
      ? { eventId: cachedEvent.id, title: cachedEvent.title }
      : null
  })
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let updateVersion = 0

    const updateTag = (tagId: string | null) => {
      const requestVersion = ++updateVersion
      if (pathname !== PATHS.HOME || !tagId) {
        setSelectedTag(null)
        return
      }
      if (tagId === UPCOMING_TAG_ID) {
        setSelectedTag(NAVIGATION_LABELS.upcoming)
        return
      }
      setSelectedTag(null)
      if (!dbReady) return

      db.tags
        .get(tagId)
        .then((tag) => {
          if (!cancelled && requestVersion === updateVersion) {
            setSelectedTag(tag?.name ?? null)
          }
        })
        .catch(() => {
          if (!cancelled && requestVersion === updateVersion) {
            setSelectedTag(null)
          }
        })
    }

    const syncTagFromUrl = () => {
      updateTag(new URLSearchParams(window.location.search).get('tag'))
    }

    syncTagFromUrl()
    window.addEventListener('popstate', syncTagFromUrl)
    const unsubscribe = subscribeToActiveTagChange(updateTag)
    return () => {
      cancelled = true
      window.removeEventListener('popstate', syncTagFromUrl)
      unsubscribe()
    }
  }, [dbReady, pathname])

  useEffect(() => {
    if (!eventId) return

    let cancelled = false
    const cachedEvent = getCachedEvent(eventId)
    setEventTitle(
      cachedEvent
        ? { eventId: cachedEvent.id, title: cachedEvent.title }
        : null,
    )
    if (dbReady) {
      getEvent(eventId)
        .then((event) => {
          if (!cancelled) {
            setEventTitle(
              event ? { eventId: event.id, title: event.title } : null,
            )
          }
        })
        .catch(() => {
          if (!cancelled) setEventTitle(null)
        })
    }

    return () => {
      cancelled = true
    }
  }, [dbReady, eventId])

  if (pathname === PATHS.HOME) {
    return {
      label: selectedTag ?? NAVIGATION_LABELS.events,
      hasParent: selectedTag !== null,
    }
  }

  return {
    label:
      eventId && eventTitle?.eventId === eventId
        ? eventTitle.title
        : getPageTitle(pathname),
    hasParent: true,
  }
}
