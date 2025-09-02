import { TimeDiff } from '@/types/datetimeDiff'
import dayjs from 'dayjs'

export const calculateTimeDiff = (past: string, now = dayjs()): TimeDiff => {
  const pastDatetime = dayjs(past)
  const diff = now.diff(pastDatetime)

  if (diff === 0) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  if (diff <= 0) {
    return calculateTimeDiff(now.toString(), pastDatetime)
  }

  const years = now.diff(pastDatetime, 'year')
  const months = now.diff(pastDatetime, 'month') % 12
  const days = now.diff(pastDatetime, 'day') % 30
  const hours = now.diff(pastDatetime, 'hour') % 24
  const minutes = now.diff(pastDatetime, 'minute') % 60
  const seconds = now.diff(pastDatetime, 'second') % 60

  return { years, months, days, hours, minutes, seconds }
}
