import { Counter, LiveCounter } from '@/components/Counter'
import { Card, CardTitle } from '@/components/ui/card'
import { EventWithTags } from '@/types/event'
import dayjs, { Dayjs } from 'dayjs'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { memo } from 'react'

interface ListEventProps {
  event: EventWithTags
  now?: Dayjs
  liveCounter?: boolean
  draggable?: boolean
}

export const ListEvent = ({
  event,
  now,
  liveCounter = false,
  draggable = false,
}: ListEventProps) => {
  const router = useRouter()
  const displayEventDatetime = dayjs(event.datetime).format('DD MMM YYYY HH:mm')
  const displayTags = event.tags.filter((tag) => !tag.system)

  const handleClick = () => {
    router.push(`/event/${event.id}`)
  }

  return (
    <Card
      className={cn(
        'gap-0 py-0 transition-colors hover:border-primary/30 hover:bg-accent',
        draggable
          ? 'cursor-grab select-none active:cursor-grabbing'
          : 'cursor-pointer',
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-1 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base tracking-tight">
            {event.title}
          </CardTitle>
          <div className="mt-1 min-h-5 font-mono text-sm font-semibold tabular-nums text-timer">
            {liveCounter ? (
              <LiveCounter event={event} />
            ) : now ? (
              <Counter event={event} now={now} />
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="text-xs text-muted-foreground">
              {displayEventDatetime}
            </span>
            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {displayTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-tag px-2 py-0.5 text-xs font-medium text-tag-foreground"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export const MemoizedListEvent = memo(ListEvent)
