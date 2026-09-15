import { calculateTimeDiff } from '@/helpers/datetime/calculateTimeDiff'
import { getEventCounter } from '@/helpers/datetime/eventTiming'
import { Event } from '@/types/event'
import { Dayjs } from 'dayjs'
import { useEventListClock } from '@/components/Event/EventListClock'

export const Counter = ({
  event,
  now,
  from,
}: {
  event: Event
  now: Dayjs
  from?: string
}) => {
  const counter = getEventCounter(event, now)
  const displayEvent = event.dateOnly
    ? {
        ...event,
        hours: false,
        minutes: false,
        seconds: false,
        days: event.days || (!event.months && !event.years),
      }
    : event
  const timeDiff = calculateTimeDiff(
    displayEvent,
    from ?? counter.from.toISOString(),
    from ? now : counter.to,
  )

  const units = [
    ['years', 'y'],
    ['months', 'mo'],
    ['days', 'd'],
    ['hours', 'h'],
    ['minutes', 'm'],
    ['seconds', 's'],
  ] as const
  const selected = units.filter(([unit]) => displayEvent[unit])
  const nonzero = selected.filter(([unit]) => timeDiff[unit] > 0)
  const visible = nonzero.length ? nonzero : selected.slice(-1)

  return (
    <span className="inline-flex max-w-full">
      <span className="sr-only">{counter.label}</span>
      <span className="flex flex-wrap gap-x-2 gap-y-1 sm:justify-end">
        {counter.duration || (
          <>
            {visible.map(([unit, suffix]) => (
              <span key={unit} className="whitespace-nowrap">
                {timeDiff[unit]}
                <span className="ml-0.5 text-[0.6em] font-medium tracking-normal">
                  {suffix}
                </span>
              </span>
            ))}
          </>
        )}
      </span>
    </span>
  )
}

export const LiveCounter = ({ event }: { event: Event }) => {
  const now = useEventListClock()

  return <Counter event={event} now={now} />
}
