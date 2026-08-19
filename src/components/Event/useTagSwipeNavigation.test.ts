import { describe, expect, it } from 'vitest'
import {
  getAdjacentTagId,
  hasHorizontalSwipeIntent,
  shouldCompleteTagSwipe,
} from './useTagSwipeNavigation'

describe('hasHorizontalSwipeIntent', () => {
  it('accepts deliberate horizontal movement', () => {
    expect(hasHorizontalSwipeIntent(80, 10)).toBe(true)
  })

  it('rejects diagonal movement that is too close to vertical', () => {
    expect(hasHorizontalSwipeIntent(80, 70)).toBe(false)
  })
})

describe('shouldCompleteTagSwipe', () => {
  it('completes a swipe after sufficient distance', () => {
    expect(shouldCompleteTagSwipe(90, 10, 0.2, 360)).toBe(true)
  })

  it('completes a short, intentional fling', () => {
    expect(shouldCompleteTagSwipe(30, 5, 0.6, 360)).toBe(true)
  })

  it('snaps back after a short or ambiguous drag', () => {
    expect(shouldCompleteTagSwipe(30, 5, 0.2, 360)).toBe(false)
    expect(shouldCompleteTagSwipe(90, 80, 0.8, 360)).toBe(false)
  })
})

describe('getAdjacentTagId', () => {
  const tags = [{ id: 'all' }, { id: 'personal' }, { id: 'work' }]

  it('selects the adjacent tag in the requested direction', () => {
    expect(getAdjacentTagId(tags, 'personal', 'next')).toBe('work')
    expect(getAdjacentTagId(tags, 'personal', 'previous')).toBe('all')
  })

  it('does not wrap or navigate from an unknown tag', () => {
    expect(getAdjacentTagId(tags, 'all', 'previous')).toBeNull()
    expect(getAdjacentTagId(tags, 'work', 'next')).toBeNull()
    expect(getAdjacentTagId(tags, 'missing', 'next')).toBeNull()
  })
})
