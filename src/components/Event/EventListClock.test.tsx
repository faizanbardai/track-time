// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ListEvent } from './ListEvent'
import { LiveCounter } from '@/components/Counter'
import { calculateDuration } from '@/helpers/datetime/calculateTimeDiff'
import { EventListClock } from '@/components/Event/EventListClock'
import { PreviewPanel } from '@/components/Event/ListEvents'
import type { Event, EventWithTags } from '@/types/event'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const counterText = (text: string) => (_: string, element: Element | null) =>
  element?.textContent === text &&
  Array.from(element.children).every((child) => child.textContent !== text)

const createEvent = (
  id: string,
  datetime: string,
  endDate?: string,
): Event => ({
  id,
  title: `Event ${id}`,
  datetime,
  ...(endDate ? { endDate } : {}),
  seconds: true,
  minutes: false,
  hours: false,
  days: false,
  months: false,
  years: false,
  createdAt: datetime,
  updatedAt: datetime,
})

const createEventWithTags = (id: string): EventWithTags => ({
  ...createEvent(id, '2025-01-01T00:00:00.000Z'),
  tags: [],
})

const ClockedCounters = () => {
  return (
    <>
      <LiveCounter event={createEvent('one', '2024-12-31T23:59:59.000Z')} />
      <LiveCounter event={createEvent('two', '2024-12-31T23:59:59.000Z')} />
    </>
  )
}

const ClockedCounter = () => {
  return (
    <LiveCounter event={createEvent('future', '2025-01-01T00:00:02.000Z')} />
  )
}

describe('EventListClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('uses one interval for multiple counters and updates them together', () => {
    render(
      <EventListClock>
        <ClockedCounters />
      </EventListClock>,
    )

    expect(vi.getTimerCount()).toBe(1)
    expect(screen.getAllByText(counterText('1s'))).toHaveLength(2)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getAllByText(counterText('2s'))).toHaveLength(2)
  })

  it('updates a counter after a future datetime is reached', () => {
    render(
      <EventListClock>
        <ClockedCounter />
      </EventListClock>,
    )

    expect(screen.getByText(counterText('2s'))).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText(counterText('1s'))).toBeTruthy()
  })

  it('counts time since completion after the event ends', () => {
    render(
      <EventListClock>
        <LiveCounter
          event={createEvent(
            'ended',
            '2024-01-01T00:00:00.000Z',
            '2024-12-31T23:59:59.000Z',
          )}
        />
      </EventListClock>,
    )

    expect(screen.getByText('Since completion')).toBeTruthy()
    expect(screen.getByText(counterText('1s'))).toBeTruthy()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText(counterText('2s'))).toBeTruthy()
  })

  it('updates progress and switches to completed at the end', () => {
    render(
      <EventListClock>
        <ListEvent
          liveCounter
          event={{
            ...createEvent(
              'flight',
              '2024-12-31T23:59:58.000Z',
              '2025-01-01T00:00:02.000Z',
            ),
            tags: [],
          }}
        />
      </EventListClock>,
    )
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(
      '50',
    )
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(
      '75',
    )
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('Duration · 4s')).toBeTruthy()
    expect(screen.getByText(counterText('0s'))).toBeTruthy()
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.getByText('Since completion')).toBeTruthy()
  })

  it('calculates duration independently of the selected counter units', () => {
    const duration = calculateDuration(
      '2008-01-01T00:00:00.000Z',
      '2012-12-31T00:00:00.000Z',
    )

    expect(duration.years).toBe(4)
    expect(duration.months).toBe(11)
  })

  it('renders preview counters without live subscriptions', () => {
    const events = [createEventWithTags('preview')]
    const { rerender } = render(
      <EventListClock>
        <PreviewPanel events={events} />
      </EventListClock>,
    )

    expect(screen.getByText('Event preview')).toBeTruthy()
    expect(screen.getByText(counterText('0s'))).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText(counterText('0s'))).toBeTruthy()
    expect(vi.getTimerCount()).toBe(1)

    rerender(
      <EventListClock>
        <PreviewPanel events={[createEventWithTags('preview')]} />
      </EventListClock>,
    )
    expect(screen.getByText(counterText('3s'))).toBeTruthy()
  })
})
