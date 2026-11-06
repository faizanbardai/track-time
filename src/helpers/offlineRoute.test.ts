import { describe, expect, it } from 'vitest'
import { getOfflineEventId } from './offlineRoute'

describe('getOfflineEventId', () => {
  it('returns the event id from an event detail path', () => {
    expect(getOfflineEventId('/event/event-1')).toBe('event-1')
  })

  it('decodes an encoded event id', () => {
    expect(getOfflineEventId('/event/event%201')).toBe('event 1')
  })

  it('ignores paths that are not event details', () => {
    expect(getOfflineEventId('/event')).toBeNull()
    expect(getOfflineEventId('/tags')).toBeNull()
    expect(getOfflineEventId('/event/%E0%A4%A')).toBeNull()
  })
})
