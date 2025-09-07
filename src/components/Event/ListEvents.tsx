'use client'

import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableEventItem } from './SortableEventItem'
import { useListEvents } from '@/components/Event/useListEvents'

export const ListEvents = () => {
  const { loading, events, sensors, handleDragEnd } = useListEvents()
  if (loading) {
    return (
      <div className="col-span-full text-center text-muted-foreground py-12">
        Loading events...
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={events.map((event) => String(event.id))}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid grid-cols-1 gap-4 py-2">
          {events.map((event) => (
            <SortableEventItem key={event.id} event={event} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
