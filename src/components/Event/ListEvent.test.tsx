// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListEvent } from '@/components/Event/ListEvent'
import { getCachedEvent } from '@/helpers/indexedDB'
import type { EventWithTags } from '@/types/event'

const push = vi.fn()
const prefetch = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, prefetch }),
}))

const event: EventWithTags = {
  id: 'event-1',
  title: 'Event one',
  datetime: '2025-01-01T00:00:00.000Z',
  seconds: true,
  minutes: false,
  hours: false,
  days: false,
  months: false,
  years: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  tags: [],
}

describe('ListEvent navigation', () => {
  beforeEach(() => {
    push.mockClear()
    prefetch.mockClear()
  })

  it('prefetches and caches the event before navigating', () => {
    render(<ListEvent event={event} />)
    const card = screen.getByText(event.title).closest('[class]')

    expect(card).not.toBeNull()
    fireEvent.mouseEnter(card as Element)
    fireEvent.click(card as Element)

    expect(prefetch).toHaveBeenCalledWith('/event/event-1')
    expect(push).toHaveBeenCalledWith('/event/event-1')
    expect(getCachedEvent(event.id)).toEqual(event)
  })
})
