import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { Event, EventFormData } from '@/types/event'
import { calculateDuration } from './calculateTimeDiff'

dayjs.extend(utc)
dayjs.extend(timezone)

export const isValidTimeZone = (zone: string) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format()
    return Boolean(zone)
  } catch {
    return false
  }
}

export const parseEventInput = (date: string, time: string, zone: string) =>
  dayjs.tz(`${date}T${time}`, zone)

export const serializeEventDates = (form: EventFormData) => {
  if (!form.dateOnly) {
    for (const [date, time, zone] of [
      [form.date, form.time, form.timeZone],
      ...(form.hasEnd ? [[form.endDate, form.endTime, form.endTimeZone]] : []),
    ]) {
      if (!isValidTimeZone(zone)) throw new Error('Enter a valid timezone')
      if (
        !date ||
        !time ||
        parseEventInput(date, time, zone).format('YYYY-MM-DDTHH:mm') !==
          `${date}T${time}`
      ) {
        throw new Error(
          'Enter a valid date and time. This time may not exist because the clocks change.',
        )
      }
    }
    if (
      form.hasEnd &&
      !parseEventInput(form.endDate, form.endTime, form.endTimeZone).isAfter(
        parseEventInput(form.date, form.time, form.timeZone),
      )
    ) {
      throw new Error('End must be after start')
    }
  } else if (form.hasEnd && (!form.endDate || form.endDate < form.date)) {
    throw new Error('End date must be on or after start date')
  }

  if (form.dateOnly) {
    return {
      datetime: form.date,
      ...(form.hasEnd ? { endDate: form.endDate } : {}),
      dateOnly: true,
    }
  }
  return {
    datetime: parseEventInput(
      form.date,
      form.time,
      form.timeZone,
    ).toISOString(),
    ...(form.hasEnd
      ? {
          endDate: parseEventInput(
            form.endDate,
            form.endTime,
            form.endTimeZone,
          ).toISOString(),
          endTimeZone: form.endTimeZone,
        }
      : {}),
    dateOnly: false,
    timeZone: form.timeZone,
  }
}

export const getEventBounds = (event: Event) => ({
  start: dayjs(event.datetime),
  // Date-only ranges include the entire final day, including DST changes.
  end: event.endDate
    ? event.dateOnly
      ? dayjs(event.endDate).add(1, 'day').startOf('day')
      : dayjs(event.endDate)
    : null,
})

export const getEventStatus = (event: Event, now: Dayjs) => {
  const { start, end } = getEventBounds(event)
  if (now.isBefore(start)) return 'upcoming'
  if (end) return now.isBefore(end) ? 'ongoing' : 'completed'
  if (event.dateOnly && now.isSame(start, 'day')) return 'today'
  return 'past'
}

export const getEventDurationLabel = (event: Event) => {
  if (!event.endDate) return null
  if (event.dateOnly) {
    const end = dayjs(event.endDate).add(1, 'day').format('YYYY-MM-DD')
    const duration = calculateDuration(event.datetime, end)
    const units = [
      ['years', 'y'],
      ['months', 'mo'],
      ['days', 'd'],
    ] as const
    return units
      .filter(([unit]) => duration[unit] > 0)
      .map(([unit, label]) => `${duration[unit]}${label}`)
      .join(' ')
  }
  const minutes = dayjs(event.endDate).diff(dayjs(event.datetime), 'minute')
  if (minutes >= 24 * 60) {
    const duration = calculateDuration(event.datetime, event.endDate)
    const units = [
      ['years', 'y'],
      ['months', 'mo'],
      ['days', 'd'],
      ['hours', 'h'],
      ['minutes', 'm'],
      ['seconds', 's'],
    ] as const
    return units
      .filter(([unit]) => duration[unit] > 0)
      .map(([unit, label]) => `${duration[unit]}${label}`)
      .join(' ')
  }
  // Short timed intervals retain exact elapsed hours, including timezone changes.
  if (minutes < 1)
    return `${dayjs(event.endDate).diff(dayjs(event.datetime), 'second')}s`
  return [
    Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h` : '',
    minutes % 60 ? `${minutes % 60}m` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export const formatEventDate = (event: Event, end = false) => {
  const value = end ? event.endDate! : event.datetime
  const zone = end ? event.endTimeZone : event.timeZone
  const date = zone && !event.dateOnly ? dayjs(value).tz(zone) : dayjs(value)
  const showTime = !event.dateOnly && (date.hour() !== 0 || date.minute() !== 0)
  return (
    date.format(showTime ? 'DD MMM YYYY HH:mm' : 'DD MMM YYYY') +
    (zone && !event.dateOnly ? ` (${zone})` : '')
  )
}

export const getEventCounter = (event: Event, now: Dayjs) => {
  const { start, end } = getEventBounds(event)
  const status = getEventStatus(event, now)
  if (status === 'completed')
    return {
      label: 'Since completion',
      duration: null,
      from: end!,
      to: event.dateOnly ? now.startOf('day') : now,
    }
  if (status === 'today')
    return { label: 'Today', duration: '', from: start, to: start }
  const target = status === 'ongoing' ? end! : start
  return {
    label:
      status === 'ongoing'
        ? 'Remaining'
        : status === 'upcoming'
          ? event.endDate
            ? 'Starts in'
            : 'In'
          : 'Time since',
    duration: null,
    from: target,
    to: event.dateOnly ? now.startOf('day') : now,
  }
}
