'use client'

import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import dayjs from 'dayjs'
import { SortableEventItem } from './SortableEventItem'
import { MemoizedListEvent } from '@/components/Event/ListEvent'
import {
  EventListClock,
  useEventListClock,
} from '@/components/Event/EventListClock'
import { useListEvents } from '@/components/Event/useListEvents'
import { EventBottomBar } from '@/components/Event/EventBottomBar'
import { useSwipeNavigation } from '@/components/ui/useSwipeNavigation'
import { ALL_TAG_ID, UPCOMING_TAG_ID } from '@/helpers/indexedDB'
import type { EventWithTags } from '@/types/event'
import { cn } from '@/lib/utils'
import { filterUpcomingEvents } from '@/helpers/eventViews'
import { useCallback, useEffect, useState } from 'react'
import { shouldRefreshSwipePreview } from './swipePreview'

export const PreviewPanel = ({
  events,
  activeTagId,
}: {
  events: EventWithTags[]
  activeTagId?: string
}) => {
  const clockNow = useEventListClock()
  const [previewNow, setPreviewNow] = useState(() => dayjs())

  useEffect(() => {
    setPreviewNow(dayjs())
  }, [events])

  const visibleEvents =
    activeTagId === UPCOMING_TAG_ID
      ? filterUpcomingEvents(events, clockNow)
      : events

  return (
    <div className="grid min-h-full content-start gap-2">
      {visibleEvents.map((event) => (
        <MemoizedListEvent
          key={event.id}
          event={event}
          now={previewNow}
          activeTagId={activeTagId}
        />
      ))}
    </div>
  )
}

export const ListEvents = () => {
  return (
    <EventListClock>
      <ListEventsContent />
    </EventListClock>
  )
}

const ListEventsContent = () => {
  const [isSorting, setIsSorting] = useState(false)
  const [displayedTagId, setDisplayedTagId] = useState(ALL_TAG_ID)
  const {
    activeTagId,
    initialLoading,
    tagLoading,
    events,
    eventsByTag,
    sensors,
    tags,
    selectTag,
    handleDragEnd,
    canReorder,
  } = useListEvents()
  const handleSelectTag = useCallback(
    (tagId: string) => {
      setDisplayedTagId(tagId)
      selectTag(tagId)
    },
    [selectTag],
  )
  useEffect(() => {
    setDisplayedTagId(activeTagId)
  }, [activeTagId])
  const activeTagIndex = tags.findIndex(({ id }) => id === activeTagId)
  const previousTagId = tags[activeTagIndex - 1]?.id
  const nextTagId = tags[activeTagIndex + 1]?.id
  const {
    bind: swipeNavigation,
    cancel: cancelSwipeNavigation,
    isSettling,
    trackRef,
  } = useSwipeNavigation({
    activeKey: activeTagId,
    keys: tags.map(({ id }) => id),
    onSelect: handleSelectTag,
    onSwipeCommit: setDisplayedTagId,
    disabled: isSorting,
  })
  const selectTagFromBottomBar = useCallback(
    (tagId: string) => {
      cancelSwipeNavigation()
      handleSelectTag(tagId)
    },
    [cancelSwipeNavigation, handleSelectTag],
  )
  const [previewEventsByTag, setPreviewEventsByTag] = useState(eventsByTag)
  useEffect(() => {
    if (shouldRefreshSwipePreview(isSettling)) {
      setPreviewEventsByTag(eventsByTag)
    }
  }, [eventsByTag, isSettling])

  if (initialLoading) {
    return <div aria-busy="true" />
  }

  return (
    <div
      className="grid h-full grid-rows-[auto_1fr] gap-2"
      aria-busy={tagLoading}
    >
      <span className="sr-only" role="status" aria-live="polite">
        {tagLoading ? 'Loading events...' : ''}
      </span>
      <div
        data-testid="tag-swipe-surface"
        className={cn(
          'h-full min-h-[calc(100dvh-4.5rem)] touch-pan-y overflow-x-clip',
          isSettling && 'pointer-events-none',
        )}
        {...swipeNavigation}
      >
        <div
          ref={trackRef}
          className="relative h-full will-change-transform"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          {previousTagId && (
            <div
              key={previousTagId}
              className="pointer-events-none absolute top-0 right-full h-full w-full"
              aria-hidden="true"
              inert
            >
              <PreviewPanel
                events={previewEventsByTag[previousTagId] ?? []}
                activeTagId={previousTagId}
              />
            </div>
          )}

          {canReorder ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={() => setIsSorting(true)}
              onDragCancel={() => setIsSorting(false)}
              onDragEnd={(event) => {
                setIsSorting(false)
                void handleDragEnd(event)
              }}
            >
              <ActiveEventList events={events} activeTagId={activeTagId} />
            </DndContext>
          ) : (
            <StaticEventList events={events} activeTagId={activeTagId} />
          )}

          {nextTagId && (
            <div
              key={nextTagId}
              className="pointer-events-none absolute top-0 left-full h-full w-full"
              aria-hidden="true"
              inert
            >
              <PreviewPanel
                events={previewEventsByTag[nextTagId] ?? []}
                activeTagId={nextTagId}
              />
            </div>
          )}
        </div>
      </div>
      <EventBottomBar
        activeTagId={displayedTagId}
        tags={tags}
        onSelectTag={selectTagFromBottomBar}
      />
    </div>
  )
}

const StaticEventList = ({
  events,
  activeTagId,
}: {
  events: EventWithTags[]
  activeTagId: string
}) => {
  return (
    <div className="grid min-h-full grid-cols-1 content-start gap-2">
      {events.map((event) => (
        <MemoizedListEvent
          key={event.id}
          event={event}
          liveCounter
          activeTagId={activeTagId}
        />
      ))}
    </div>
  )
}

const ActiveEventList = ({
  events,
  activeTagId,
}: {
  events: EventWithTags[]
  activeTagId: string
}) => {
  return (
    <SortableContext
      items={events.map((event) => String(event.id))}
      strategy={verticalListSortingStrategy}
    >
      <div className="grid min-h-full grid-cols-1 content-start gap-2">
        {events.map((event) => (
          <SortableEventItem
            key={event.id}
            event={event}
            activeTagId={activeTagId}
          />
        ))}
      </div>
    </SortableContext>
  )
}
