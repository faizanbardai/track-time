import { describe, expect, it } from 'vitest'
import type { Event } from '@/types/event'
import { formatEventCardDate, formatEventDate } from './eventTiming'

const event: Event = {
  id: 'event',
  title: 'Meeting',
  datetime: '2026-09-15T12:00:00Z',
  timeZone: 'Europe/Berlin',
  seconds: false,
  minutes: true,
  hours: true,
  days: true,
  months: false,
  years: false,
  createdAt: '',
  updatedAt: '',
}

describe('event card dates', () => {
  it('hides the user’s zone while preserving full detail formatting', () => {
    expect(formatEventCardDate(event, 'Europe/Berlin')).toBe(
      '15 Sep 2026 14:00',
    )
    expect(formatEventDate(event)).toBe('15 Sep 2026 14:00 (Europe/Berlin)')
  })

  it('keeps foreign times in their zone with a short city label', () => {
    expect(
      formatEventCardDate(
        { ...event, timeZone: 'America/New_York' },
        'Europe/Berlin',
      ),
    ).toBe('15 Sep 2026 08:00 (New York)')
  })

  it('recognizes aliases for the same zone', () => {
    expect(
      formatEventCardDate(
        { ...event, timeZone: 'US/Eastern' },
        'America/New_York',
      ),
    ).toBe('15 Sep 2026 08:00')
  })

  it('shows a shared foreign zone only once at the end of a range', () => {
    const range = {
      ...event,
      endDate: '2026-09-15T14:00:00Z',
      endTimeZone: event.timeZone,
    }
    expect(formatEventCardDate(range, 'America/New_York')).toBe(
      '15 Sep 2026 14:00 – 15 Sep 2026 16:00 (Berlin)',
    )
    expect(formatEventCardDate(range, 'Europe/Berlin')).toBe(
      '15 Sep 2026 14:00 – 15 Sep 2026 16:00',
    )
  })

  it('labels both endpoints when their zones differ, even with equal offsets', () => {
    expect(
      formatEventCardDate(
        {
          ...event,
          endDate: '2026-09-15T14:00:00Z',
          endTimeZone: 'Europe/Paris',
        },
        'Europe/Berlin',
      ),
    ).toBe('15 Sep 2026 14:00 (Berlin) – 15 Sep 2026 16:00 (Paris)')
  })

  it('omits zones for date-only events', () => {
    expect(
      formatEventCardDate(
        { ...event, datetime: '2026-09-15', dateOnly: true },
        'America/New_York',
      ),
    ).toBe('15 Sep 2026')
  })
})
