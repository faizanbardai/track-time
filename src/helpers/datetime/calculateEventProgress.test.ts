import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { calculateEventProgressDetails } from './calculateEventProgress'
import type { Event } from '@/types/event'

const createEvent = (datetime: string, units: Partial<Event>): Event => ({
  id: 'event',
  title: 'Event',
  datetime,
  progressEnabled: false,
  seconds: false,
  minutes: false,
  hours: false,
  days: false,
  months: false,
  years: false,
  createdAt: datetime,
  updatedAt: datetime,
  ...units,
})

describe('calculateEventProgressDetails', () => {
  it('tracks hours through the current day for day-only events', () => {
    const event = createEvent('2020-01-01T00:00:00.000Z', {
      progressEnabled: true,
      days: true,
    })
    const now = dayjs('2026-08-26T11:00:00.000Z')
    const dayStart = now.startOf('day')
    const expected =
      (now.valueOf() - dayStart.valueOf()) /
      (now.add(1, 'day').startOf('day').valueOf() - dayStart.valueOf())

    expect(calculateEventProgressDetails(event, now)).toMatchObject({
      elapsedUnits: now.diff(dayStart, 'hour'),
      totalUnits: 24,
      unit: 'hours',
      description: `${now.diff(dayStart, 'hour')}/24 hours · ${Math.round(expected * 100)}%`,
    })
  })

  it('tracks months through the current age year for year-only events', () => {
    const event = createEvent('2005-04-26T00:00:00.000Z', {
      progressEnabled: true,
      years: true,
    })

    expect(
      calculateEventProgressDetails(event, dayjs('2026-08-26T00:00:00.000Z')),
    ).toMatchObject({ elapsedUnits: 4, totalUnits: 12, unit: 'months' })
  })

  it('returns null when no display unit is selected', () => {
    const event = createEvent('2020-01-01T00:00:00.000Z', {
      progressEnabled: true,
      seconds: true,
    })

    expect(calculateEventProgressDetails(event)).toBeNull()
  })
})
