import dayjs, { type Dayjs } from 'dayjs'
import type { Event, EventWithTags } from '@/types/event'
import {
  getNextAnniversaryOccurrence,
  hasAnniversaryEnabled,
} from '@/helpers/datetime/anniversary'

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

export const sortEventsByStartDate = <T extends Pick<Event, 'datetime'>>(
  events: T[],
  direction: 'asc' | 'desc' = 'asc',
) =>
  [...events].sort(
    (a, b) =>
      (dayjs(a.datetime).valueOf() - dayjs(b.datetime).valueOf()) *
      (direction === 'asc' ? 1 : -1),
  )

export const sortEventsByNextAnniversary = (
  events: EventWithTags[],
  now: Dayjs,
  direction: 'asc' | 'desc' = 'asc',
) =>
  events
    .filter(hasAnniversaryEnabled)
    .map((event, index) => ({
      event,
      index,
      nextAnniversary: getNextAnniversaryOccurrence(event, now).valueOf(),
    }))
    .sort((first, second) => {
      const delta = first.nextAnniversary - second.nextAnniversary
      return (
        (direction === 'asc' ? delta : -delta) || first.index - second.index
      )
    })
    .map(({ event }) => event)
