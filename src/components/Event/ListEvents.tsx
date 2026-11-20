'use client'

import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import dayjs from 'dayjs'
import { SortableEventItem } from './SortableEventItem'
import { MemoizedListEvent } from '@/components/Event/ListEvent'
import { EventListClock } from '@/components/Event/EventListClock'
import { useEventListViewClock } from '@/components/Event/useEventListViewClock'
import { useListEvents } from '@/components/Event/useListEvents'
import { EventBottomBar } from '@/components/Event/EventBottomBar'
import { EmptyEvents } from '@/components/Event/EmptyEvents'
import { SwipePager } from '@/components/ui/SwipePager'
import {
  ALL_TAG_ID,
  ANNIVERSARY_TAG_ID,
  UPCOMING_TAG_ID,
} from '@/helpers/indexedDB'
import type { EventWithTags } from '@/types/event'
import { getEventsForView } from '@/helpers/eventViews'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import { shouldRefreshSwipePreview } from './swipePreview'

export const PreviewPanel = ({
  events: sourceEvents,
  isSettling = false,
  activeTagId,
  sortMode = 'asc',
}: {
  events: EventWithTags[]
  isSettling?: boolean
  activeTagId?: string
  sortMode?: 'user' | 'asc' | 'desc'
}) => {
  const [events, setEvents] = useState(sourceEvents)
  useEffect(() => {
    if (shouldRefreshSwipePreview(isSettling)) setEvents(sourceEvents)
  }, [sourceEvents, isSettling])
  const upcoming = activeTagId === UPCOMING_TAG_ID
  const anniversary = activeTagId === ANNIVERSARY_TAG_ID
  const viewNow = useEventListViewClock(events, { upcoming, anniversary })
  const [previewNow, setPreviewNow] = useState(() => dayjs())

  useEffect(() => {
    setPreviewNow(dayjs())
  }, [events])

  const visibleEvents = useMemo(
    () =>
      getEventsForView(events, { upcoming, anniversary, sortMode }, viewNow),
    [anniversary, events, sortMode, upcoming, viewNow],
  )

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
    sortMode,
    getSortMode,
    toggleSortMode,
    error,
  } = useListEvents()
  if (initialLoading) {
    return <div aria-busy="true" />
  }
  const isEmptyAllView =
    activeTagId === ALL_TAG_ID && events.length === 0 && !error
  const isEmptyAnniversaryView =
    activeTagId === ANNIVERSARY_TAG_ID && events.length === 0 && !error

  return (
    <div
      className={cn('grid min-w-0 grid-rows-[1fr]', !isEmptyAllView && 'pb-40')}
      aria-busy={tagLoading}
    >
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {tagLoading ? 'Loading events...' : ''}
      </span>
      <SwipePager
        activeKey={activeTagId}
        keys={tags.map(({ id }) => id)}
        onSelect={selectTag}
        disabled={isSorting}
        testId="tag-swipe-surface"
        renderPanel={(tagId, active, isSettling) =>
          !active ? (
            <PreviewPanel
              events={eventsByTag[tagId] ?? []}
              activeTagId={tagId}
              isSettling={isSettling}
              sortMode={getSortMode(tagId)}
            />
          ) : isEmptyAllView ? (
            <EmptyEvents />
          ) : isEmptyAnniversaryView ? (
            <p className="mx-auto max-w-sm px-4 py-12 text-center text-sm text-muted-foreground">
              No anniversaries yet. Enable “Show progress to next anniversary”
              on an event to see it here.
            </p>
          ) : canReorder ? (
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
          )
        }
        renderNavigation={(value, select) =>
          isEmptyAllView ? null : (
            <EventBottomBar
              activeTagId={value}
              tags={tags}
              sortMode={sortMode}
              onSelectTag={select}
              onToggleSort={toggleSortMode}
            />
          )
        }
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
