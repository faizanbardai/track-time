// @vitest-environment jsdom

import { useState } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { SwipeEventData, SwipeableProps } from 'react-swipeable'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SwipePager } from './SwipePager'
import { BottomPillSelector } from './BottomPill'

const swipeable = vi.hoisted(() => ({ props: null as SwipeableProps | null }))
vi.mock('react-swipeable', () => ({
  useSwipeable: (props: SwipeableProps) => {
    swipeable.props = props
    return { ref: () => {} }
  },
}))

const modes = ['backup', 'restore'] as const
const Harness = ({ disabled = false }: { disabled?: boolean }) => {
  const [activeKey, setActiveKey] = useState<(typeof modes)[number]>('backup')
  return (
    <SwipePager
      activeKey={activeKey}
      keys={modes}
      onSelect={setActiveKey}
      keepMounted
      disabled={disabled}
      tabIdBase="data"
      testId="pager"
      renderPanel={(key) => <input aria-label={`${key} input`} />}
      renderNavigation={(value, select) => (
        <BottomPillSelector
          ariaLabel="Backup and restore"
          idBase="data"
          value={value}
          options={modes.map((value) => ({ value, label: value }))}
          onValueChange={select}
        />
      )}
    />
  )
}

const swipe = (deltaX: number) => {
  act(() => {
    swipeable.props?.onSwiped?.({
      absX: Math.abs(deltaX),
      absY: 0,
      deltaX,
      event: new Event('touchend'),
      vxvy: [Math.sign(deltaX) * 0.5, 0],
    } as SwipeEventData)
  })
}
const finish = () => act(() => vi.advanceTimersByTime(260))
const panel = (key: string) => document.getElementById(`data-${key}-panel`)!

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(360)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('SwipePager', () => {
  it('includes the panel gap in both directions and centers the selected panel', () => {
    render(<Harness />)
    const track = screen.getByTestId('pager').firstElementChild as HTMLElement
    expect(panel('restore').style.left).toBe('calc(1 * var(--swipe-step))')
    swipe(-100)
    expect(track.style.transform).toBe(
      'translate3d(calc(-1 * var(--swipe-step)), 0, 0)',
    )
    finish()
    expect(panel('restore').getAttribute('aria-hidden')).toBe('false')
    expect(track.style.transform).toBe('translate3d(0px, 0, 0)')
    swipe(100)
    expect(track.style.transform).toBe('translate3d(var(--swipe-step), 0, 0)')
    finish()
    expect(panel('backup').getAttribute('aria-hidden')).toBe('false')
  })

  it('keeps form elements and values mounted while switching and makes inactive panels inert', () => {
    render(<Harness />)
    const input = screen.getByLabelText('backup input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'secret password' } })
    fireEvent.click(screen.getByRole('tab', { name: 'restore' }))
    expect(panel('backup').hasAttribute('inert')).toBe(true)
    expect(panel('restore').hasAttribute('inert')).toBe(false)
    fireEvent.click(screen.getByRole('tab', { name: 'backup' }))
    expect(screen.getByLabelText('backup input')).toBe(input)
    expect(input.value).toBe('secret password')
  })

  it('lets a pill cancel an in-flight swipe without a delayed selection overriding it', () => {
    render(<Harness />)
    swipe(-100)
    fireEvent.click(screen.getByRole('tab', { name: 'backup' }))
    finish()
    expect(panel('backup').getAttribute('aria-hidden')).toBe('false')
    expect(
      screen.getByRole('tab', { name: 'backup' }).getAttribute('aria-selected'),
    ).toBe('true')
  })

  it('supports keyboard selection and focuses the selected tab', () => {
    render(<Harness />)
    fireEvent.keyDown(screen.getByRole('tab', { name: 'backup' }), {
      key: 'ArrowRight',
    })
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: 'restore' }),
    )
    expect(panel('restore').getAttribute('aria-hidden')).toBe('false')
  })

  it('restores the selected pill when a touch is cancelled', () => {
    render(<Harness />)
    swipe(-100)
    fireEvent.touchCancel(screen.getByTestId('pager'))
    finish()
    expect(panel('backup').getAttribute('aria-hidden')).toBe('false')
    expect(
      screen.getByRole('tab', { name: 'backup' }).getAttribute('aria-selected'),
    ).toBe('true')
  })

  it('switches immediately when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<Harness />)
    swipe(-100)
    expect(panel('restore').getAttribute('aria-hidden')).toBe('false')
    expect(vi.getTimerCount()).toBe(1) // Only the click-suppression timer remains.
  })

  it('does not wrap at an edge or navigate while sorting is enabled', () => {
    const { rerender } = render(<Harness />)
    swipe(100)
    finish()
    expect(panel('backup').getAttribute('aria-hidden')).toBe('false')
    rerender(<Harness disabled />)
    swipe(-100)
    finish()
    expect(panel('backup').getAttribute('aria-hidden')).toBe('false')
  })
})
