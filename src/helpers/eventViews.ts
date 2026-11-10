import dayjs, { type Dayjs } from 'dayjs'
import type { Event, EventWithTags } from '@/types/event'

export const isUpcomingOrOngoingEvent = (event: Event, now: Dayjs) => {
  const nowTimestamp = now.valueOf()
  if (dayjs(event.datetime).valueOf() > nowTimestamp) return true
  if (!event.endDate) return false

  // Date-only end dates include the whole final day.
  const end = dayjs(event.endDate)
  const endExclusive = event.dateOnly ? end.add(1, 'day').startOf('day') : end
  return endExclusive.valueOf() > nowTimestamp
}

export const filterUpcomingEvents = (events: EventWithTags[], now: Dayjs) =>
  events.filter((event) => isUpcomingOrOngoingEvent(event, now))
