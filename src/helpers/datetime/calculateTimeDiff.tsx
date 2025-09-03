import { TimeDiff } from '@/types/datetimeDiff'
import { Event } from '@/types/event'
import dayjs from 'dayjs'

export const calculateTimeDiff = (
  event: Event,
  past: string = event.datetime,
  now = dayjs(),
): TimeDiff => {
  const pastDatetime = dayjs(past)
  let cursor = dayjs(past)
  const diff = now.diff(pastDatetime)

  if (diff === 0) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  if (diff <= 0) {
    return calculateTimeDiff(event, now.toString(), pastDatetime)
  }

  const years = now.diff(cursor, 'year')
  if (event.years && years > 0) cursor = cursor.add(years, 'year')
  const months = now.diff(cursor, 'month')
  if (event.months && months > 0) cursor = cursor.add(months, 'month')
  const days = now.diff(cursor, 'day')
  if (event.days && days > 0) cursor = cursor.add(days, 'day')
  const hours = now.diff(cursor, 'hour')
  if (event.hours && hours > 0) cursor = cursor.add(hours, 'hour')
  const minutes = now.diff(cursor, 'minute')
  if (event.minutes && minutes > 0) cursor = cursor.add(minutes, 'minute')
  const seconds = now.diff(cursor, 'second')

  return { years, months, days, hours, minutes, seconds }
}
