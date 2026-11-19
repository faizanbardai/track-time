import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { filterUpcomingEvents, sortEventsByNextAnniversary } from './eventViews'
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

  it('includes ongoing date-only events through their final day', () => {
    const events = [
      {
        ...createEvent('ongoing', '2026-06-24'),
        dateOnly: true,
        endDate: '2028-06-23',
      },
      {
        ...createEvent('completed', '2026-06-24'),
        dateOnly: true,
        endDate: '2026-06-24',
      },
    ]

    expect(
      filterUpcomingEvents(events, dayjs('2026-06-25T12:00:00')).map(
        ({ id }) => id,
      ),
    ).toEqual(['ongoing'])
    expect(
      filterUpcomingEvents(events, dayjs('2028-06-23T12:00:00')).map(
        ({ id }) => id,
      ),
    ).toEqual(['ongoing'])
    expect(
      filterUpcomingEvents(events, dayjs('2028-06-24T00:00:00')).map(
        ({ id }) => id,
      ),
    ).toEqual([])
  })
})

describe('sortEventsByNextAnniversary', () => {
  const anniversary = (id: string, date: string): EventWithTags => ({
    ...createEvent(id, date),
    dateOnly: true,
    anniversaryProgressEnabled: true,
  })

  it('sorts enabled anniversaries by their next occurrence and excludes others', () => {
    const events = [
      anniversary('later', '2000-07-01'),
      anniversary('passed', '2000-05-01'),
      anniversary('soon', '2000-06-12'),
      createEvent('disabled', '2000-06-11'),
    ]
    const now = dayjs('2026-06-10T12:00:00')

    expect(
      sortEventsByNextAnniversary(events, now).map(({ id }) => id),
    ).toEqual(['soon', 'later', 'passed'])
    expect(
      sortEventsByNextAnniversary(events, now, 'desc').map(({ id }) => id),
    ).toEqual(['passed', 'later', 'soon'])
  })

  it('supports the legacy single-date anniversary preference', () => {
    const legacy = {
      ...createEvent('legacy', '2000-06-12'),
      dateOnly: true,
      progressEnabled: true,
    }

    expect(
      sortEventsByNextAnniversary([legacy], dayjs('2026-06-10')).map(
        ({ id }) => id,
      ),
    ).toEqual(['legacy'])
  })
})
