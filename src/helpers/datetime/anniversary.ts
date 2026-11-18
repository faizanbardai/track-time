import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { Event } from '@/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

export const hasAnniversaryEnabled = (event: Event) =>
  event.anniversaryProgressEnabled ??
  (!event.endDate && Boolean(event.progressEnabled))

const getOccurrence = (event: Event, year: number) => {
  const value = event.endDate ?? event.datetime
  const zone = event.endDate ? event.endTimeZone : event.timeZone
  const anchor = !event.dateOnly && zone ? dayjs(value).tz(zone) : dayjs(value)
  const date = anchor.year(year)
  const dateTime = `${date.format('YYYY-MM-DD')}T${
    event.dateOnly ? '00:00:00' : anchor.format('HH:mm:ss.SSS')
  }`

  // Reparse each year so its timezone offset follows daylight saving rules.
  return !event.dateOnly && zone ? dayjs.tz(dateTime, zone) : dayjs(dateTime)
}

const getAnniversaryYear = (event: Event, now: Dayjs) => {
  const zone = event.endDate ? event.endTimeZone : event.timeZone
  return !event.dateOnly && zone ? now.tz(zone).year() : now.year()
}

export const getAnniversaryProgressBounds = (event: Event, now: Dayjs) => {
  let year = getAnniversaryYear(event, now)
  if (getOccurrence(event, year).isAfter(now)) year -= 1

  return {
    start: getOccurrence(event, year),
    next: getOccurrence(event, year + 1),
  }
}

export const getNextAnniversaryOccurrence = (event: Event, now: Dayjs) => {
  const year = getAnniversaryYear(event, now)
  const occurrence = getOccurrence(event, year)
  return occurrence.isBefore(now) ? getOccurrence(event, year + 1) : occurrence
}
