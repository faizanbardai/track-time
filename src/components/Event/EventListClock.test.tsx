// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Counter } from '@/components/Counter'
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
        <Counter event={createEvent('one', '2024-12-31T23:59:59.000Z')} />
        <Counter event={createEvent('two', '2024-12-31T23:59:59.000Z')} />
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
        <Counter event={createEvent('future', '2025-01-01T00:00:02.000Z')} />
      </EventListClock>,
    )

    expect(screen.getByText('2s')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('1s')).toBeTruthy()
  })

  it('renders preview events without live counters or subscriptions', () => {
    render(<PreviewPanel events={[createEventWithTags('preview')]} />)

    expect(screen.getByText('Event preview')).toBeTruthy()
    expect(screen.queryByText('0s')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })
})
