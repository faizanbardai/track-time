import { calculateTimeDiff } from '@/helpers/datetime/calculateTimeDiff'
import { Event } from '@/types/event'
import { Dayjs } from 'dayjs'
import { useEventListClock } from '@/components/Event/EventListClock'

export const Counter = ({
  event,
  now,
  from = event.endDate ?? event.datetime,
}: {
  event: Event
  now: Dayjs
  from?: string
}) => {
  const timeDiff = calculateTimeDiff(event, from, now)

  const years = event.years ? <span>{timeDiff.years}Y </span> : null
  const months = event.months ? <span>{timeDiff.months}M </span> : null
  const days = event.days ? <span>{timeDiff.days}d </span> : null
  const hours = event.hours ? <span>{timeDiff.hours}h </span> : null
  const minutes = event.minutes ? <span>{timeDiff.minutes}m </span> : null
  const seconds = event.seconds ? <span>{timeDiff.seconds}s </span> : null

  return (
    <span>
      {years} {months} {days} {hours} {minutes} {seconds}
    </span>
  )
}

export const LiveCounter = ({ event }: { event: Event }) => {
  const now = useEventListClock()

  return <Counter event={event} now={now} />
}
