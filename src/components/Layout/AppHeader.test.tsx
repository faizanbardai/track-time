// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { SwipeEventData, SwipeableProps } from 'react-swipeable'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppHeader } from './AppHeader'

const swipeable = vi.hoisted(() => ({ props: null as SwipeableProps | null }))

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
}))
vi.mock('@/components/OfflineAwareLink', () => ({
  OfflineAwareLink: ({
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props} />
  ),
}))
vi.mock('react-swipeable', () => ({
  useSwipeable: (props: SwipeableProps) => {
    swipeable.props = props
    return { ref: () => undefined }
  },
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('AppHeader navigation drawer', () => {
  it('opens the modal drawer and closes it from the close button', () => {
    render(<AppHeader />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Track Time' })
    expect(dialog.getAttribute('data-state')).toBe('open')
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', { name: 'Close navigation menu' }),
    )
    expect(dialog.getAttribute('data-state')).toBe('open')
    act(() => vi.advanceTimersByTime(220))
    expect(screen.queryByRole('dialog', { name: 'Track Time' })).toBeNull()
  })

  it('closes with Escape', () => {
    render(<AppHeader />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Track Time' })
    fireEvent.keyDown(dialog, { key: 'Escape' })
    act(() => vi.advanceTimersByTime(220))
    expect(screen.queryByRole('dialog', { name: 'Track Time' })).toBeNull()
  })

  it('closes when the backdrop is tapped', () => {
    render(<AppHeader />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    )
    fireEvent.click(screen.getByTestId('navigation-overlay'))
    act(() => vi.advanceTimersByTime(220))
    expect(screen.queryByRole('dialog', { name: 'Track Time' })).toBeNull()
  })

  it('opens with a right swipe from the left screen edge', () => {
    render(<AppHeader />)
    const dispatchPointer = (
      type: 'pointerdown' | 'pointerup',
      clientX: number,
      clientY: number,
    ) => {
      const event = Object.assign(new Event(type), {
        button: 0,
        clientX,
        clientY,
        isPrimary: true,
        pointerId: 1,
      })
      window.dispatchEvent(event)
    }

    act(() => {
      dispatchPointer('pointerdown', 10, 120)
      dispatchPointer('pointerup', 90, 125)
    })

    expect(screen.getByRole('dialog', { name: 'Track Time' })).toBeTruthy()
  })

  it('closes after swiping left far enough on the drawer', () => {
    render(<AppHeader />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    )
    act(() => {
      swipeable.props?.onSwiped?.({
        absX: 120,
        absY: 0,
        deltaX: -120,
        event: new Event('touchend'),
        vxvy: [-0.2, 0],
      } as SwipeEventData)
    })
    act(() => vi.advanceTimersByTime(220))
    expect(screen.queryByRole('dialog', { name: 'Track Time' })).toBeNull()
  })

  it('closes after selecting a navigation item', () => {
    render(<AppHeader />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    )
    fireEvent.click(screen.getByRole('link', { name: 'Events' }))
    act(() => vi.advanceTimersByTime(220))
    expect(screen.queryByRole('dialog', { name: 'Track Time' })).toBeNull()
  })
})
