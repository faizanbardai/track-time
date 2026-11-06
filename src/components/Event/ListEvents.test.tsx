// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { EventWithTags } from '@/types/event'
import { ListEvents } from './ListEvents'

const mockedUseListEvents = vi.hoisted(() => vi.fn())

vi.mock('./useListEvents', () => ({
  useListEvents: mockedUseListEvents,
}))

vi.mock('./EventListClock', () => ({
  EventListClock: ({ children }: { children: ReactNode }) => children,
  useEventListClock: () => undefined,
}))

vi.mock('./ListEvent', () => ({
  MemoizedListEvent: ({ event }: { event: EventWithTags }) => (
    <p>{event.title}</p>
  ),
}))

vi.mock('@/components/Event/EventBottomBar', () => ({
  EventBottomBar: () => null,
}))

vi.mock('@/components/ui/SwipePager', () => ({
  SwipePager: ({
    activeKey,
    renderPanel,
  }: {
    activeKey: string
    renderPanel: (
      key: string,
      active: boolean,
      isSettling: boolean,
    ) => ReactNode
  }) => renderPanel(activeKey, true, false),
}))

const event: EventWithTags = {
  id: 'event-1',
  title: 'Loaded event',
  datetime: '2025-01-01',
  seconds: true,
  minutes: false,
  hours: false,
  days: false,
  months: false,
  years: false,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  tags: [],
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ListEvents', () => {
  it('keeps loaded events visible when a recoverable error is present', () => {
    mockedUseListEvents.mockReturnValue({
      activeTagId: 'all',
      initialLoading: false,
      tagLoading: false,
      events: [event],
      eventsByTag: { all: [event] },
      sensors: [],
      tags: [],
      selectTag: vi.fn(),
      handleDragEnd: vi.fn(),
      canReorder: false,
      error: 'Unable to preload events for an adjacent tag',
    })

    render(<ListEvents />)

    expect(screen.getByText('Loaded event').textContent).toBe('Loaded event')
    expect(screen.getByRole('alert').textContent).toContain(
      'Unable to preload events for an adjacent tag',
    )
  })
})
