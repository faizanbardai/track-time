import { Counter, LiveCounter } from '@/components/Counter'
import { calculateDuration } from '@/helpers/datetime/calculateTimeDiff'
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
  activeTagId?: string
}

export const ListEvent = ({
  event,
  now,
  liveCounter = false,
  draggable = false,
  activeTagId,
}: ListEventProps) => {
  const router = useRouter()
  const eventDate = dayjs(event.datetime)
  const displayEventDatetime =
    eventDate.hour() === 0 && eventDate.minute() === 0
      ? eventDate.format('DD MMM YYYY')
      : eventDate.format('DD MMM YYYY HH:mm')
  const endDate = event.endDate ? dayjs(event.endDate) : null
  const displayEndDate = endDate?.format('DD MMM YYYY')
  const duration = endDate
    ? calculateDuration(event.datetime, event.endDate as string)
    : null
  const displayDuration = duration
    ? duration.years > 0
      ? `${duration.years}Y`
      : duration.months > 0
        ? `${duration.months}M`
        : duration.days > 0
          ? `${duration.days}D`
          : duration.hours > 0
            ? `${duration.hours}h`
            : duration.minutes > 0
              ? `${duration.minutes}m`
              : `${duration.seconds}s`
    : null
  const displayTags = event.tags.filter(
    (tag) => !tag.system && tag.id !== activeTagId,
  )

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
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0 px-4 py-4">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-lg font-normal leading-tight">
            {event.title}
          </CardTitle>
          <div className="mt-1 text-xs text-muted-foreground">
            {displayEndDate ? (
              <>
                {displayEndDate} <span aria-hidden="true">|</span>{' '}
                <span className="font-mono tabular-nums">
                  {displayDuration}
                </span>
              </>
            ) : (
              displayEventDatetime
            )}
          </div>
        </div>
        <div className="min-w-[7.5rem] whitespace-nowrap text-right font-mono text-3xl font-semibold leading-none tracking-tight tabular-nums text-timer">
          {liveCounter ? (
            <LiveCounter event={event} />
          ) : now ? (
            <Counter event={event} now={now} />
          ) : null}
        </div>
        {displayTags.length > 0 && (
          <div className="col-span-full mt-1 flex flex-wrap gap-1">
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
    </Card>
  )
}

export const MemoizedListEvent = memo(ListEvent)
