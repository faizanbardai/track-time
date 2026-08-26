import { afterEach, describe, expect, it } from 'vitest'
import {
  cacheEvent,
  clearCachedEvent,
  getCachedEvent,
} from '@/helpers/indexedDB'
import type { EventWithTags } from '@/types/event'

const createEvent = (id: string): EventWithTags => ({
  id,
  title: `Event ${id}`,
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
})

describe('event cache', () => {
  afterEach(() => {
    for (let index = 0; index < 51; index += 1) {
      clearCachedEvent(`cache-test-${index}`)
    }
  })

  it('stores and clears an event', () => {
    const event = createEvent('cache-test-event')

    cacheEvent(event)

    expect(getCachedEvent(event.id)).toEqual(event)

    clearCachedEvent(event.id)

    expect(getCachedEvent(event.id)).toBeNull()
  })

  it('keeps the cache bounded by removing the oldest event', () => {
    for (let index = 0; index < 50; index += 1) {
      cacheEvent(createEvent(`cache-test-${index}`))
    }

    cacheEvent(createEvent('cache-test-50'))

    expect(getCachedEvent('cache-test-0')).toBeNull()
    expect(getCachedEvent('cache-test-50')).not.toBeNull()
  })
})
