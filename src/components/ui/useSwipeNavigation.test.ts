// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import type { SwipeEventData, SwipeableProps } from 'react-swipeable'
import { describe, expect, it } from 'vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import {
  getAdjacentKey,
  hasHorizontalSwipeIntent,
  shouldCompleteSwipe,
  useSwipeNavigation,
} from './useSwipeNavigation'

const swipeable = vi.hoisted(() => ({
  props: null as SwipeableProps | null,
}))

vi.mock('react-swipeable', () => ({
  useSwipeable: (props: SwipeableProps) => {
    swipeable.props = props
    return { ref: vi.fn() }
  },
}))

const completedLeftSwipe = {
  absX: 100,
  absY: 0,
  deltaX: -100,
  event: new Event('touchend'),
  vxvy: [0.5, 0],
} as SwipeEventData

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  swipeable.props = null
})

describe('hasHorizontalSwipeIntent', () => {
  it('accepts deliberate horizontal movement', () => {
    expect(hasHorizontalSwipeIntent(80, 10)).toBe(true)
  })

  it('rejects diagonal movement that is too close to vertical', () => {
    expect(hasHorizontalSwipeIntent(80, 70)).toBe(false)
  })
})

describe('shouldCompleteSwipe', () => {
  it('completes a swipe after sufficient distance', () => {
    expect(shouldCompleteSwipe(90, 10, 0.2, 360)).toBe(true)
  })

  it('completes a short, intentional fling', () => {
    expect(shouldCompleteSwipe(30, 5, 0.6, 360)).toBe(true)
  })

  it('snaps back after a short or ambiguous drag', () => {
    expect(shouldCompleteSwipe(30, 5, 0.2, 360)).toBe(false)
    expect(shouldCompleteSwipe(90, 80, 0.8, 360)).toBe(false)
  })
})

describe('getAdjacentKey', () => {
  const keys = ['all', 'personal', 'work']

  it('selects the adjacent key in the requested direction', () => {
    expect(getAdjacentKey(keys, 'personal', 'next')).toBe('work')
    expect(getAdjacentKey(keys, 'personal', 'previous')).toBe('all')
  })

  it('does not wrap or navigate from an unknown key', () => {
    expect(getAdjacentKey(keys, 'all', 'previous')).toBeNull()
    expect(getAdjacentKey(keys, 'work', 'next')).toBeNull()
    expect(getAdjacentKey(keys, 'missing', 'next')).toBeNull()
  })
})

describe('useSwipeNavigation', () => {
  it('does not overwrite a newer selection when a swipe finishes settling', () => {
    const onSelect = vi.fn()
    const { result, rerender } = renderHook(
      ({ activeKey }) =>
        useSwipeNavigation({
          activeKey,
          keys: ['backup', 'restore', 'settings'],
          onSelect,
        }),
      { initialProps: { activeKey: 'backup' } },
    )

    act(() => {
      result.current.bind.ref({ clientWidth: 360 } as HTMLElement)
      swipeable.props?.onSwiped?.(completedLeftSwipe)
    })

    rerender({ activeKey: 'settings' })

    act(() => {
      vi.advanceTimersByTime(260)
    })

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('cancels a settling swipe when the current key is selected directly', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useSwipeNavigation({
        activeKey: 'backup',
        keys: ['backup', 'restore'],
        onSelect,
      }),
    )

    act(() => {
      result.current.bind.ref({ clientWidth: 360 } as HTMLElement)
      swipeable.props?.onSwiped?.(completedLeftSwipe)
      result.current.cancel()
      vi.advanceTimersByTime(260)
    })

    expect(onSelect).not.toHaveBeenCalled()
  })
})
