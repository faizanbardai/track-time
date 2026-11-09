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
import { EmptyEvents } from '@/components/Event/EmptyEvents'
import { SwipePager } from '@/components/ui/SwipePager'
import { ALL_TAG_ID, UPCOMING_TAG_ID } from '@/helpers/indexedDB'
import type { EventWithTags } from '@/types/event'
import { filterUpcomingEvents } from '@/helpers/eventViews'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { shouldRefreshSwipePreview } from './swipePreview'

export const PreviewPanel = ({
  events: sourceEvents,
  isSettling = false,
  activeTagId,
}: {
  events: EventWithTags[]
  isSettling?: boolean
  activeTagId?: string
}) => {
  const [events, setEvents] = useState(sourceEvents)
  useEffect(() => {
    if (shouldRefreshSwipePreview(isSettling)) setEvents(sourceEvents)
  }, [sourceEvents, isSettling])
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
    error,
  } = useListEvents()
  if (initialLoading) {
    return <div aria-busy="true" />
  }
  const isEmptyAllView =
    activeTagId === ALL_TAG_ID && events.length === 0 && !error

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
            />
          ) : isEmptyAllView ? (
            <EmptyEvents />
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
              onSelectTag={select}
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
