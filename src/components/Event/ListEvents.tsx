'use client'

import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import dayjs from 'dayjs'
import { SortableEventItem } from './SortableEventItem'
import { MemoizedListEvent } from '@/components/Event/ListEvent'
import { EventListClock } from '@/components/Event/EventListClock'
import { useListEvents } from '@/components/Event/useListEvents'
import { EventBottomBar } from '@/components/Event/EventBottomBar'
import { useTagSwipeNavigation } from '@/components/Event/useTagSwipeNavigation'
import type { EventWithTags } from '@/types/event'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export const PreviewPanel = ({ events }: { events: EventWithTags[] }) => {
  const [now, setNow] = useState(() => dayjs())

  useEffect(() => {
    setNow(dayjs())
  }, [events])

  return (
    <div className="grid min-h-full content-start gap-2">
      {events.map((event) => (
        <MemoizedListEvent key={event.id} event={event} now={now} />
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
  } = useListEvents()
  const activeTagIndex = tags.findIndex(({ id }) => id === activeTagId)
  const previousTagId = tags[activeTagIndex - 1]?.id
  const nextTagId = tags[activeTagIndex + 1]?.id
  const {
    bind: swipeNavigation,
    isSettling,
    trackRef,
  } = useTagSwipeNavigation({
    activeTagId,
    tags,
    onSelectTag: selectTag,
    disabled: isSorting,
  })

  if (initialLoading) {
    return (
      <div className="col-span-full text-center text-muted-foreground py-12">
        Loading events...
      </div>
    )
  }

  return (
    <div
      className="grid h-full grid-rows-[auto_1fr] gap-2"
      aria-busy={tagLoading}
    >
      <div className="relative h-0.5 overflow-hidden rounded-full">
        {tagLoading && (
          <div
            className="event-list-progress absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary"
            aria-hidden="true"
          />
        )}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {tagLoading ? 'Loading events...' : ''}
      </span>
      <div
        className={cn(
          'h-full touch-pan-y overflow-x-clip',
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
              <PreviewPanel events={eventsByTag[previousTagId] ?? []} />
            </div>
          )}

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
            <ActiveEventList events={events} />
          </DndContext>

          {nextTagId && (
            <div
              key={nextTagId}
              className="pointer-events-none absolute top-0 left-full h-full w-full"
              aria-hidden="true"
              inert
            >
              <PreviewPanel events={eventsByTag[nextTagId] ?? []} />
            </div>
          )}
        </div>
      </div>
      <EventBottomBar
        activeTagId={activeTagId}
        tags={tags}
        onSelectTag={selectTag}
      />
    </div>
  )
}

const ActiveEventList = ({ events }: { events: EventWithTags[] }) => {
  return (
    <SortableContext
      items={events.map((event) => String(event.id))}
      strategy={verticalListSortingStrategy}
    >
      <div className="grid min-h-full grid-cols-1 content-start gap-2">
        {events.map((event) => (
          <SortableEventItem key={event.id} event={event} />
        ))}
      </div>
    </SortableContext>
  )
}
