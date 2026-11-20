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

export const getEventsForView = (
  events: EventWithTags[],
  {
    upcoming = false,
    anniversary = false,
    sortMode,
  }: {
    upcoming?: boolean
    anniversary?: boolean
    sortMode: 'user' | 'asc' | 'desc'
  },
  now: Dayjs,
) => {
  const filteredEvents = upcoming ? filterUpcomingEvents(events, now) : events

  if (anniversary) {
    return sortEventsByNextAnniversary(
      filteredEvents,
      now,
      sortMode === 'desc' ? 'desc' : 'asc',
    )
  }

  return sortMode === 'user'
    ? filteredEvents
    : sortEventsByStartDate(filteredEvents, sortMode)
}

export const getNextEventViewTransition = (
  events: EventWithTags[],
  {
    upcoming = false,
    anniversary = false,
  }: { upcoming?: boolean; anniversary?: boolean },
  now: Dayjs,
) => {
  const transitions: Dayjs[] = []

  if (upcoming) {
    for (const event of events) {
      if (!event.endDate) {
        const start = dayjs(event.datetime)
        if (start.isAfter(now)) transitions.push(start)
      }

      if (event.endDate) {
        const end = event.dateOnly
          ? dayjs(event.endDate).add(1, 'day').startOf('day')
          : dayjs(event.endDate)
        if (end.isAfter(now)) transitions.push(end)
      }
    }
  }

  if (anniversary) {
    for (const event of events) {
      if (!hasAnniversaryEnabled(event)) continue
      const occurrence = getNextAnniversaryOccurrence(
        event,
        now.add(1, 'millisecond'),
      )
      if (occurrence.isAfter(now)) transitions.push(occurrence)
    }
  }

  return transitions.reduce<Dayjs | null>(
    (next, transition) =>
      !next || transition.isBefore(next) ? transition : next,
    null,
  )
}
