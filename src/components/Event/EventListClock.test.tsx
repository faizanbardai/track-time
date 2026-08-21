// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LiveCounter } from '@/components/Counter'
import { EventListClock } from '@/components/Event/EventListClock'
import { PreviewPanel } from '@/components/Event/ListEvents'
import type { Event, EventWithTags } from '@/types/event'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const createEvent = (id: string, datetime: string): Event => ({
  id,
  title: `Event ${id}`,
  datetime,
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
    expect(screen.getAllByText('1s')).toHaveLength(2)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getAllByText('2s')).toHaveLength(2)
  })

  it('updates a counter after a future datetime is reached', () => {
    render(
      <EventListClock>
        <ClockedCounter />
      </EventListClock>,
    )

    expect(screen.getByText('2s')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('1s')).toBeTruthy()
  })

  it('renders preview counters without live subscriptions', () => {
    const events = [createEventWithTags('preview')]
    const { rerender } = render(<PreviewPanel events={events} />)

    expect(screen.getByText('Event preview')).toBeTruthy()
    expect(screen.getByText('0s')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('0s')).toBeTruthy()
    expect(vi.getTimerCount()).toBe(0)

    rerender(<PreviewPanel events={[createEventWithTags('preview')]} />)
    expect(screen.getByText('3s')).toBeTruthy()
  })
})
