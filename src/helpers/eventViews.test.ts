import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { filterUpcomingEvents } from './eventViews'
import type { EventWithTags } from '@/types/event'

const createEvent = (id: string, datetime: string): EventWithTags => ({
  id,
  title: id,
  datetime,
  seconds: true,
  minutes: false,
  hours: false,
  days: false,
  months: false,
  years: false,
  createdAt: datetime,
  updatedAt: datetime,
  tags: [],
})

describe('filterUpcomingEvents', () => {
  it('keeps only events after now', () => {
    const now = dayjs('2025-01-01T12:00:00.000Z')
    const events = [
      createEvent('past', '2025-01-01T11:59:59.000Z'),
      createEvent('current', '2025-01-01T12:00:00.000Z'),
      createEvent('future', '2025-01-01T12:00:01.000Z'),
    ]

    expect(filterUpcomingEvents(events, now).map(({ id }) => id)).toEqual([
      'future',
    ])
  })

  it('compares timestamps instead of datetime string formatting', () => {
    const now = dayjs('2025-01-01T12:00:00.000Z')
    const events = [createEvent('future', '2025-01-01T13:00:00+01:00')]

    expect(filterUpcomingEvents(events, now)).toHaveLength(0)
  })
})
