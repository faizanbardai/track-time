import { Counter } from '@/components/Counter'
import {
  formatEventCardDate,
  getEventDurationLabel,
} from '@/helpers/datetime/eventTiming'
import { useEventListClock } from './EventListClock'
import { calculateEventProgressDetails } from '@/helpers/datetime/calculateEventProgress'
import { Card, CardTitle } from '@/components/ui/card'
import { EventWithTags } from '@/types/event'
import dayjs, { Dayjs } from 'dayjs'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { memo } from 'react'
import { cacheEvent } from '@/helpers/indexedDB'

interface ListEventProps {
  event: EventWithTags
  now?: Dayjs
  liveCounter?: boolean
  draggable?: boolean
  activeTagId?: string
}

const LiveListEvent = (props: EventPageCardProps) => {
  const now = useEventListClock()
  return <EventCard {...props} now={now} />
}

type EventPageCardProps = Omit<ListEventProps, 'liveCounter'>

export const ListEvent = ({ liveCounter, ...props }: ListEventProps) =>
  liveCounter ? <LiveListEvent {...props} /> : <EventCard {...props} />

const EventCard = ({
  event,
  now,
  draggable = false,
  activeTagId,
}: EventPageCardProps) => {
  const router = useRouter()
  const displayEventDatetime = formatEventCardDate(event)
  const displayDuration = getEventDurationLabel(event)
  const displayTags = event.tags.filter(
    (tag) => !tag.system && tag.id !== activeTagId,
  )
  const progressDetails = calculateEventProgressDetails(event, now ?? dayjs())
  const eventPath = `/event/${event.id}`

  const handleClick = () => {
    cacheEvent(event)
    router.push(eventPath)
  }

  const prefetchEvent = () => {
    void router.prefetch(eventPath)
  }

  return (
    <Card
      className={cn(
        'relative gap-0 overflow-hidden py-0 transition-colors hover:border-primary/30 hover:bg-accent',
        draggable
          ? 'cursor-grab select-none active:cursor-grabbing'
          : 'cursor-pointer',
      )}
      onClick={handleClick}
      onMouseEnter={prefetchEvent}
      onFocus={prefetchEvent}
    >
      <div className="grid min-w-0 gap-2 p-3 sm:gap-3 sm:p-4">
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <CardTitle className="min-w-0 max-w-full flex-auto line-clamp-2 break-words text-base font-medium leading-snug sm:text-lg">
            {event.title}
          </CardTitle>
          <div className="ml-auto max-w-full shrink-0 text-right text-2xl font-semibold leading-tight tabular-nums tracking-tight text-timer sm:text-3xl">
            {now ? <Counter event={event} now={now} /> : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-1.5">
          <div className="min-w-0 max-w-full flex-auto break-words text-xs leading-relaxed text-foreground/70 sm:text-sm">
            <p>{displayEventDatetime}</p>
            {displayDuration && (
              <p className="mt-0.5 sm:mt-1">Duration · {displayDuration}</p>
            )}
          </div>
          {displayTags.length > 0 && (
            <div className="ml-auto flex max-w-full flex-wrap justify-end gap-1.5">
              {displayTags.map((tag) => (
                <span
                  key={tag.id}
                  className="max-w-full break-words rounded-full bg-tag/15 px-2 py-0.5 text-xs font-medium text-foreground/75"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
        {progressDetails && (
          <div className="grid gap-1.5 border-t border-border/60 pt-2 sm:gap-2 sm:pt-3">
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <span>{progressDetails.targetDate ?? progressDetails.label}</span>
              <span aria-hidden="true">|</span>
              <span className="shrink-0 tabular-nums">
                {progressDetails.percent}%
              </span>
            </div>
            <div
              aria-label={progressDetails.description}
              className="h-1 sm:h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressDetails.percent}
            >
              <div
                aria-hidden="true"
                className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${progressDetails.progress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export const MemoizedListEvent = memo(ListEvent)
