// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import EventPage from './page'
import { EventBottomBar } from '@/components/Event/EventBottomBar'
import CreateOrUpdateEvent from '@/components/Event/CreateOrUpdateEvent'
import { db, getEvent, listEventsByTag } from '@/helpers/indexedDB'
import type { Tag } from '@/types/event'
import { SwipePager } from '@/components/ui/SwipePager'

const navigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
  push: vi.fn(),
}))
const loading = vi.hoisted(() => ({
  startLoading: vi.fn(),
  stopLoading: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => navigation.params,
  useRouter: () => ({ push: navigation.push }),
}))
vi.mock('@/components/providers/indexedDB', () => ({
  useIndexedDB: () => ({ dbReady: true, dbError: null }),
}))
vi.mock('@/components/providers/loading', () => ({
  useLoadingActions: () => loading,
}))
vi.mock('@/components/providers/toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

const tag: Tag = {
  id: 'work & travel',
  name: 'Work & Travel',
  system: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

beforeEach(async () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false })),
  )
  Element.prototype.scrollTo = vi.fn()
  navigation.params = new URLSearchParams()
  navigation.push.mockClear()
  await db.events.clear()
  await db.tagEventOrder.clear()
  await db.tags.clear()
  await db.tags.put(tag)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Adding an event from a tag view', () => {
  it('updates the plus destination when the selected tag changes', () => {
    const { rerender } = render(
      <EventBottomBar activeTagId="all" tags={[tag]} onSelectTag={vi.fn()} />,
    )
    const link = screen.getByRole('link', { name: 'Add new entry' })
    expect(link.getAttribute('href')).toBe('/event')

    rerender(
      <EventBottomBar
        activeTagId={tag.id}
        tags={[tag]}
        onSelectTag={vi.fn()}
      />,
    )
    const url = new URL(link.getAttribute('href')!, 'http://localhost')
    expect(url.searchParams.get('tag')).toBe(tag.id)

    rerender(
      <EventBottomBar activeTagId="all" tags={[tag]} onSelectTag={vi.fn()} />,
    )
    expect(link.getAttribute('href')).toBe('/event')
  })

  it.each([
    ['Personal', '/event?tag=personal'],
    ['All', '/event'],
    ['Upcoming events', '/event'],
  ])(
    'uses the highlighted %s selection before the URL updates',
    (name, path) => {
      navigation.params.set('tag', tag.id)
      const tags: Tag[] = [
        { ...tag, id: 'all', name: 'All', system: true },
        { ...tag, id: 'upcoming', name: 'Upcoming', system: true },
        tag,
        { ...tag, id: 'personal', name: 'Personal' },
      ]
      const Harness = () => {
        const [activeKey, setActiveKey] = useState(tag.id)
        return (
          <SwipePager
            activeKey={activeKey}
            keys={tags.map(({ id }) => id)}
            onSelect={setActiveKey}
            renderPanel={() => null}
            renderNavigation={(value, select) => (
              <EventBottomBar
                activeTagId={value}
                tags={tags}
                onSelectTag={select}
              />
            )}
          />
        )
      }

      render(<Harness />)
      fireEvent.click(screen.getByRole('button', { name }))
      expect(
        screen.getByRole('button', { name }).getAttribute('aria-pressed'),
      ).toBe('true')
      expect(navigation.params.get('tag')).toBe(tag.id)
      expect(
        screen
          .getByRole('link', { name: 'Add new entry' })
          .getAttribute('href'),
      ).toBe(path)
    },
  )

  it('carries the active tag from the plus action into the form and saves it', async () => {
    const bar = render(
      <EventBottomBar
        activeTagId={tag.id}
        tags={[tag]}
        onSelectTag={vi.fn()}
      />,
    )
    const url = new URL(
      screen.getByRole('link', { name: 'Add new entry' }).getAttribute('href')!,
      'http://localhost',
    )
    expect(url.pathname).toBe('/event')
    expect(url.searchParams.get('tag')).toBe(tag.id)
    navigation.params = url.searchParams
    bar.unmount()

    render(<EventPage />)
    await screen.findByRole('button', { name: `Remove ${tag.name}` })
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Trip' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Event' }))
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/'))

    const events = await listEventsByTag(tag.id)
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Trip')

    cleanup()
    render(
      <CreateOrUpdateEvent
        event={(await getEvent(events[0].id))!}
        defaultTags="Another tag"
      />,
    )
    expect(
      screen.getByRole('button', { name: `Remove ${tag.name}` }),
    ).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Remove Another tag' }),
    ).toBeNull()
  })

  it('lets the user remove the default and select another tag', async () => {
    navigation.params.set('tag', tag.id)
    render(<EventPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: `Remove ${tag.name}` }),
    )
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'Personal' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(
      screen.queryByRole('button', { name: `Remove ${tag.name}` }),
    ).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove Personal' })).toBeTruthy()
  })

  it.each(['all', 'upcoming', 'deleted'])(
    '%s has no default tag in the plus destination',
    (activeTagId) => {
      render(
        <EventBottomBar
          activeTagId={activeTagId}
          tags={[tag]}
          onSelectTag={vi.fn()}
        />,
      )
      expect(
        screen
          .getByRole('link', { name: 'Add new entry' })
          .getAttribute('href'),
      ).toBe('/event')
    },
  )

  it.each([null, 'all', 'upcoming', 'deleted'])(
    'opens without custom tags for %s',
    async (tagId) => {
      if (tagId) navigation.params.set('tag', tagId)
      render(<EventPage />)
      await screen.findByRole('button', { name: 'Create Event' })
      expect(screen.queryByRole('button', { name: /^Remove / })).toBeNull()
    },
  )
})
