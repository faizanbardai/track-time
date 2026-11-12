// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { SwipeEventData, SwipeableProps } from 'react-swipeable'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppHeader } from './AppHeader'
import { dispatchActiveTagChange } from '@/lib/activeTagChange'

const { swipeable, currentPath } = vi.hoisted(() => ({
  swipeable: { props: null as SwipeableProps | null },
  currentPath: { value: '/' },
}))

vi.mock('next/navigation', () => ({ usePathname: () => currentPath.value }))
vi.mock('@/components/providers/indexedDB', () => ({
  useIndexedDB: () => ({ dbReady: false }),
}))
vi.mock('@/helpers/indexedDB', () => ({
  db: { tags: { get: vi.fn(async () => null) } },
  getCachedEvent: () => null,
  getEvent: vi.fn(async () => null),
  UPCOMING_TAG_ID: 'upcoming',
}))
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
  currentPath.value = '/'
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('AppHeader navigation drawer', () => {
  it('shows the current page in an accessible breadcrumb', () => {
    currentPath.value = '/tags'
    render(<AppHeader />)

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(breadcrumb.textContent).toContain('Events')
    expect(breadcrumb.textContent).toContain('Manage tags')
    expect(
      screen.getByRole('link', { name: 'Events' }).getAttribute('href'),
    ).toBe('/')
    expect(screen.getByText('Manage tags').getAttribute('aria-current')).toBe(
      'page',
    )
  })

  it('uses a stable fallback label for an event while its title is unavailable', () => {
    currentPath.value = '/event/event-1'
    render(<AppHeader />)

    expect(screen.getByText('Edit event').getAttribute('aria-current')).toBe(
      'page',
    )
  })

  it('shows the active event filter in the breadcrumb', () => {
    render(<AppHeader />)
    act(() => dispatchActiveTagChange('upcoming'))

    expect(screen.getByText('Upcoming').getAttribute('aria-current')).toBe(
      'page',
    )
  })

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

  it('closes after swiping left far enough on the drawer', () => {
    render(<AppHeader />)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
    fireEvent.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    )
    const drawer = screen.getByRole('dialog', { name: 'Track Time' })
    act(() => {
      swipeable.props?.onSwiping?.({
        absX: 60,
        absY: 0,
        deltaX: -60,
        event: new Event('touchmove'),
        vxvy: [-0.2, 0],
      } as SwipeEventData)
      expect(drawer.style.translate).toBe('-60px 0')
      swipeable.props?.onSwiped?.({
        absX: 120,
        absY: 0,
        deltaX: -120,
        event: new Event('touchend'),
        vxvy: [-0.2, 0],
      } as SwipeEventData)
    })
    expect(drawer.style.translate).toBe('')
    expect(drawer.className).toContain('-translate-x-full')
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
