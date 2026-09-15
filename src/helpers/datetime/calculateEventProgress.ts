import dayjs from 'dayjs'
import type { Event } from '@/types/event'
import { getEventBounds, getEventStatus } from './eventTiming'

export const calculateEventProgressDetails = (event: Event, now = dayjs()) => {
  const status = getEventStatus(event, now)
  let { start, end } = getEventBounds(event)
  let anniversary = false

  if (status !== 'ongoing') {
    const enabled =
      event.anniversaryProgressEnabled ??
      (!event.endDate && Boolean(event.progressEnabled))
    if (!enabled || status === 'upcoming') return null

    // Anniversaries use the selected calendar date, not the exclusive range boundary.
    const zone = event.endDate ? event.endTimeZone : event.timeZone
    const date = event.endDate ?? event.datetime
    const anchor = !event.dateOnly && zone ? dayjs(date).tz(zone) : dayjs(date)
    const localNow = !event.dateOnly && zone ? now.tz(zone) : now
    const anniversaryIn = (year: number) => {
      const calendar = anchor.year(year)
      const value =
        calendar.format('YYYY-MM-DD') +
        (event.dateOnly ? 'T00:00:00' : anchor.format('[T]HH:mm:ss.SSS'))
      // Reparse each year so its timezone offset follows daylight saving rules.
      return !event.dateOnly && zone ? dayjs.tz(value, zone) : dayjs(value)
    }
    let year = localNow.year()
    if (anniversaryIn(year).isAfter(now)) year -= 1
    start = anniversaryIn(year)
    end = anniversaryIn(year + 1)
    anniversary = true
  }

  if (!end || !end.isAfter(start)) return null
  const progress = Math.min(
    1,
    Math.max(
      0,
      (now.valueOf() - start.valueOf()) / (end.valueOf() - start.valueOf()),
    ),
  )
  const percent = anniversary
    ? Math.floor(progress * 100)
    : Math.round(progress * 100)
  return {
    progress,
    percent,
    label: anniversary ? 'To next anniversary' : 'Event progress',
    targetDate: anniversary ? end.format('DD MMM YYYY') : null,
    description: anniversary
      ? `${Math.floor(progress * 100)}% to next anniversary · ${end.format('DD MMM YYYY')}`
      : `${Math.round(progress * 100)}% elapsed`,
  }
}
