import type { Dayjs } from 'dayjs'
import type { EventWithTags } from '@/types/event'

export const filterUpcomingEvents = (events: EventWithTags[], now: Dayjs) => {
  const nowTimestamp = now.valueOf()

  return events.filter((event) => Date.parse(event.datetime) > nowTimestamp)
}
