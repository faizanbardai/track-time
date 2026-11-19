import dayjs from 'dayjs'
import type { Event } from '@/types/event'
import { getEventBounds, getEventStatus } from './eventTiming'
import {
  getAnniversaryProgressBounds,
  hasAnniversaryEnabled,
} from './anniversary'

export const calculateEventProgressDetails = (event: Event, now = dayjs()) => {
  const status = getEventStatus(event, now)
  let { start, end } = getEventBounds(event)
  let anniversary = false

  if (status !== 'ongoing') {
    if (!hasAnniversaryEnabled(event) || status === 'upcoming') return null

    const bounds = getAnniversaryProgressBounds(event, now)
    start = bounds.start
    end = bounds.next
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
