import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { calculateEventProgressDetails } from './calculateEventProgress'
import {
  getEventCounter,
  getEventDurationLabel,
  getEventStatus,
  serializeEventDates,
} from './eventTiming'
import { getEventDefaultValues } from './getEventDefaultValues'
import type { Event } from '@/types/event'

const event: Event = {
  id: 'flight',
  title: 'Flight',
  datetime: '2026-08-10T10:00:00Z',
  endDate: '2026-08-10T12:30:00Z',
  seconds: false,
  minutes: true,
  hours: true,
  days: false,
  months: false,
  years: false,
  createdAt: '',
  updatedAt: '',
}

describe('event timing', () => {
  it('counts to start before departure and to end during the flight', () => {
    expect(
      getEventCounter(event, dayjs('2026-08-10T09:00:00Z')).from.toISOString(),
    ).toBe('2026-08-10T10:00:00.000Z')
    expect(getEventCounter(event, dayjs('2026-08-10T11:00:00Z')).label).toBe(
      'Remaining',
    )
    expect(getEventCounter(event, dayjs('2026-08-10T13:00:00Z'))).toMatchObject(
      { label: 'Since completion', duration: null },
    )
  })

  it('counts elapsed time from completion, not from the start', () => {
    const completed = getEventCounter(
      {
        ...event,
        datetime: '2003-06-01T00:00:00Z',
        endDate: '2006-06-01T00:00:00Z',
      },
      dayjs('2026-06-01T00:00:00Z'),
    )
    expect(completed.to.diff(completed.from, 'year')).toBe(20)
    const vacation = getEventCounter(
      {
        ...event,
        datetime: '2026-08-10',
        endDate: '2026-08-16',
        dateOnly: true,
      },
      dayjs('2026-08-18T12:00:00'),
    )
    expect(vacation.to.diff(vacation.from, 'day')).toBe(1)
  })

  it('measures the event interval independently of display units or legacy settings', () => {
    const now = dayjs('2026-08-10T11:00:00Z')
    expect(calculateEventProgressDetails(event, now)).toMatchObject({
      progress: 0.4,
      description: '40% elapsed',
    })
    expect(
      calculateEventProgressDetails(
        { ...event, years: true, progressEnabled: false },
        now,
      ),
    ).toEqual(calculateEventProgressDetails(event, now))
  })

  it('shows no progress outside an active range or for a single date without opt-in', () => {
    for (const now of ['2026-08-10T09:00:00Z', '2026-08-10T12:30:00Z']) {
      expect(calculateEventProgressDetails(event, dayjs(now))).toBeNull()
    }
    expect(
      calculateEventProgressDetails({
        ...event,
        endDate: undefined,
        anniversaryProgressEnabled: false,
      }),
    ).toBeNull()
    expect(
      calculateEventProgressDetails({ ...event, endDate: event.datetime }),
    ).toBeNull()
  })

  it('includes the final vacation day, including a one-day vacation', () => {
    const vacation = {
      ...event,
      dateOnly: true,
      datetime: '2026-08-10',
      endDate: '2026-08-16',
    }
    expect(getEventDurationLabel(vacation)).toBe('7d')
    expect(getEventStatus(vacation, dayjs('2026-08-16T23:59:59'))).toBe(
      'ongoing',
    )
    expect(getEventStatus(vacation, dayjs('2026-08-17T00:00:00'))).toBe(
      'completed',
    )
    expect(
      getEventDurationLabel({ ...vacation, endDate: vacation.datetime }),
    ).toBe('1d')
  })

  it('keeps date-only events as calendar dates and timed events as instants', () => {
    const form = {
      ...getEventDefaultValues(),
      date: '2026-08-10',
      endDate: '2026-08-16',
      hasEnd: true,
    }
    expect(serializeEventDates(form)).toMatchObject({
      datetime: '2026-08-10',
      endDate: '2026-08-16',
      dateOnly: true,
    })
    const flight = serializeEventDates({
      ...form,
      dateOnly: false,
      endDate: '2026-08-10',
      time: '10:00',
      endTime: '12:30',
      timeZone: 'Europe/Berlin',
      endTimeZone: 'Europe/London',
    })
    expect(getEventDurationLabel({ ...event, ...flight })).toBe('3h 30m')
  })

  it('uses actual elapsed hours across daylight saving changes', () => {
    const dates = serializeEventDates({
      ...getEventDefaultValues(),
      dateOnly: false,
      hasEnd: true,
      date: '2026-03-29',
      endDate: '2026-03-29',
      time: '01:00',
      endTime: '04:00',
      timeZone: 'Europe/Berlin',
      endTimeZone: 'Europe/Berlin',
    })
    expect(getEventDurationLabel({ ...event, ...dates })).toBe('2h')
  })

  it('rejects nonexistent local times during the spring clock change', () => {
    expect(() =>
      serializeEventDates({
        ...getEventDefaultValues(),
        dateOnly: false,
        date: '2026-03-29',
        time: '02:30',
        timeZone: 'Europe/Berlin',
      }),
    ).toThrow('This time may not exist')
  })

  it('formats multi-year intervals as calendar units instead of total hours', () => {
    expect(
      getEventDurationLabel({
        ...event,
        datetime: '2015-04-15T00:00:00',
        endDate: '2018-09-30T00:00:00',
      }),
    ).toBe('3y 5mo 15d')
    expect(
      getEventDurationLabel({
        ...event,
        datetime: '2020-09-01T00:00:00',
        endDate: '2024-06-30T00:00:00',
      }),
    ).toBe('3y 9mo 29d')
  })

  it('formats long date-only ranges using calendar units and includes the last day', () => {
    expect(
      getEventDurationLabel({
        ...event,
        dateOnly: true,
        datetime: '2020-09-01',
        endDate: '2024-06-30',
      }),
    ).toBe('3y 10mo')
    expect(
      getEventDurationLabel({
        ...event,
        dateOnly: true,
        datetime: '2024-02-01',
        endDate: '2024-02-29',
      }),
    ).toBe('1mo')
  })

  it('shows today for a date-only milestone without an end', () => {
    expect(
      getEventCounter(
        {
          ...event,
          datetime: '2026-08-10',
          endDate: undefined,
          dateOnly: true,
        },
        dayjs('2026-08-10T12:00:00'),
      ).label,
    ).toBe('Today')
  })
})

describe('anniversary progress', () => {
  const birthday = {
    ...event,
    datetime: '2000-06-15',
    endDate: undefined,
    dateOnly: true,
    anniversaryProgressEnabled: true,
  }

  it('resets on the anniversary and advances toward the next one', () => {
    expect(
      calculateEventProgressDetails(birthday, dayjs('2026-06-15')),
    ).toMatchObject({
      progress: 0,
      description: '0% to next anniversary · 15 Jun 2027',
    })
    const halfway = calculateEventProgressDetails(
      birthday,
      dayjs('2026-12-15'),
    )!
    expect(halfway.progress).toBeGreaterThan(0.49)
    expect(halfway.progress).toBeLessThan(0.51)
    expect(
      calculateEventProgressDetails(birthday, dayjs('1999-12-15')),
    ).toBeNull()
  })

  it('uses the completion date for completed ranges and keeps active interval progress', () => {
    const education = {
      ...birthday,
      datetime: '2003-06-01',
      endDate: '2006-06-01',
    }
    expect(
      calculateEventProgressDetails(education, dayjs('2026-06-01'))
        ?.description,
    ).toBe('0% to next anniversary · 01 Jun 2027')
    expect(
      calculateEventProgressDetails(
        { ...event, anniversaryProgressEnabled: true },
        dayjs('2026-08-10T11:00:00Z'),
      )?.description,
    ).toBe('40% elapsed')
  })

  it('uses February 28 in non-leap years and returns to February 29 in leap years', () => {
    const leap = { ...birthday, datetime: '2000-02-29' }
    expect(
      calculateEventProgressDetails(leap, dayjs('2027-02-28')),
    ).toMatchObject({
      progress: 0,
      description: '0% to next anniversary · 29 Feb 2028',
    })
  })

  it('restores legacy single-date preferences and allows explicitly disabling them', () => {
    const legacy = {
      ...birthday,
      anniversaryProgressEnabled: undefined,
      progressEnabled: true,
    }
    expect(
      calculateEventProgressDetails(legacy, dayjs('2026-12-15')),
    ).not.toBeNull()
    expect(
      calculateEventProgressDetails(
        { ...legacy, anniversaryProgressEnabled: false },
        dayjs('2026-12-15'),
      ),
    ).toBeNull()
  })

  it('resets at the saved timezone time even when viewed elsewhere', () => {
    const zoned = {
      ...birthday,
      dateOnly: false,
      datetime: '2000-06-15T07:00:00Z',
      timeZone: 'Europe/Berlin',
    }
    expect(
      calculateEventProgressDetails(zoned, dayjs('2026-06-15T07:00:00Z'))
        ?.progress,
    ).toBe(0)
    expect(
      calculateEventProgressDetails(zoned, dayjs('2026-06-15T06:59:59Z'))
        ?.progress,
    ).toBeGreaterThan(0.99)
  })
})
