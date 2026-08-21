import { MemoizedListEvent } from '@/components/Event/ListEvent'
import { EventWithTags } from '@/types/event'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableEventItemProps {
  event: EventWithTags
}

export const SortableEventItem = ({ event }: SortableEventItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-swipe-navigation-drag-surface
      aria-label={`Reorder ${event.title}`}
      {...attributes}
      {...listeners}
    >
      <MemoizedListEvent event={event} liveCounter draggable />
    </div>
  )
}
