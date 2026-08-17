'use client'

import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableEventItem } from './SortableEventItem'
import { useListEvents } from '@/components/Event/useListEvents'
import { EventBottomBar } from '@/components/Event/EventBottomBar'

export const ListEvents = () => {
  const {
    activeTagId,
    initialLoading,
    tagLoading,
    events,
    sensors,
    tags,
    selectTag,
    handleDragEnd,
  } = useListEvents()
  if (initialLoading) {
    return (
      <div className="col-span-full text-center text-muted-foreground py-12">
        Loading events...
      </div>
    )
  }

  return (
    <div className="grid gap-2" aria-busy={tagLoading}>
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={events.map((event) => String(event.id))}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-2">
            {events.map((event) => (
              <SortableEventItem key={event.id} event={event} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <EventBottomBar
        activeTagId={activeTagId}
        tags={tags}
        onSelectTag={selectTag}
      />
    </div>
  )
}
