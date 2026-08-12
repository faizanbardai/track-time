import { ListEvent } from '@/components/Event/ListEvent'
import { EventWithTags } from '@/types/event'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

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
    <div ref={setNodeRef} style={style}>
      <ListEvent
        event={event}
        dragHandle={
          <button
            type="button"
            className="text-muted-foreground hover:bg-accent hover:text-foreground -mr-2 flex size-8 shrink-0 touch-none cursor-grab items-center justify-center rounded-md active:cursor-grabbing"
            aria-label={`Reorder ${event.title}`}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        }
      />
    </div>
  )
}
