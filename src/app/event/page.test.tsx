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

describe('Event dates', () => {
  it('saves an inclusive date-only range and removes its end when edited', async () => {
    render(<CreateOrUpdateEvent event={null} />)
    expect(screen.queryByText('Show progress')).toBeNull()
    expect(screen.queryByLabelText('Start time')).toBeNull()
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Vacation' },
    })
    fireEvent.change(screen.getByLabelText('Date'), {
      target: { value: '2026-08-10' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Add end date' }))
    fireEvent.change(screen.getByLabelText('End date'), {
      target: { value: '2026-08-16' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Event' }))
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/'))
    const [event] = await listEventsByTag('all')
    expect(event).toMatchObject({
      dateOnly: true,
      datetime: '2026-08-10',
      endDate: '2026-08-16',
    })
    cleanup()
    navigation.push.mockClear()
    render(<CreateOrUpdateEvent event={event} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Add end date' }))
    fireEvent.click(screen.getByRole('button', { name: 'Update Event' }))
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/'))
    expect((await getEvent(event.id))?.endDate).toBeUndefined()
  })

  it('uses the selected start timezone for the end by default', async () => {
    render(<CreateOrUpdateEvent event={null} />)
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Meeting' },
    })
    fireEvent.change(screen.getByLabelText('Date'), {
      target: { value: '2026-08-10' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include time' }))
    fireEvent.change(screen.getByLabelText('Start time'), {
      target: { value: '10:00' },
    })
    fireEvent.change(screen.getByLabelText('Start timezone'), {
      target: { value: 'Tokyo' },
    })
    fireEvent.keyDown(screen.getByLabelText('Start timezone'), { key: 'Enter' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Add end date' }))
    expect(screen.queryByLabelText('End timezone')).toBeNull()
    fireEvent.change(screen.getByLabelText('End date'), {
      target: { value: '2026-08-10' },
    })
    fireEvent.change(screen.getByLabelText('End time'), {
      target: { value: '11:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Event' }))
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/'))
    const [event] = await listEventsByTag('all')
    expect(event).toMatchObject({
      timeZone: 'Asia/Tokyo',
      endTimeZone: 'Asia/Tokyo',
      endDate: '2026-08-10T02:00:00.000Z',
    })
  })

  it('validates timed ranges and saves timezone-aware endpoints', async () => {
    render(<CreateOrUpdateEvent event={null} />)
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Flight' },
    })
    fireEvent.change(screen.getByLabelText('Date'), {
      target: { value: '2026-08-10' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include time' }))
    fireEvent.change(screen.getByLabelText('Start time'), {
      target: { value: '10:00' },
    })
    fireEvent.change(screen.getByLabelText('Start timezone'), {
      target: { value: 'Europe/Berlin' },
    })
    fireEvent.keyDown(screen.getByLabelText('Start timezone'), { key: 'Enter' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Add end date' }))
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'End uses a different timezone' }),
    )
    fireEvent.change(screen.getByLabelText('End date'), {
      target: { value: '2026-08-10' },
    })
    fireEvent.change(screen.getByLabelText('End time'), {
      target: { value: '08:00' },
    })
    fireEvent.change(screen.getByLabelText('End timezone'), {
      target: { value: 'Europe/London' },
    })
    fireEvent.keyDown(screen.getByLabelText('End timezone'), { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: 'Create Event' }))
    expect(await screen.findByText('End must be after start')).toBeTruthy()
    expect(navigation.push).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('End time'), {
      target: { value: '12:30' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Event' }))
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/'))
    const [event] = await listEventsByTag('all')
    expect(event).toMatchObject({
      dateOnly: false,
      datetime: '2026-08-10T08:00:00.000Z',
      endDate: '2026-08-10T11:30:00.000Z',
      timeZone: 'Europe/Berlin',
      endTimeZone: 'Europe/London',
    })
    cleanup()
    render(<CreateOrUpdateEvent event={event} />)
    expect(
      (screen.getByLabelText('Start time') as HTMLInputElement).value,
    ).toBe('10:00')
    expect((screen.getByLabelText('End time') as HTMLInputElement).value).toBe(
      '12:30',
    )
  })
})

it('saves, restores, and disables anniversary progress', async () => {
  const { unmount } = render(<CreateOrUpdateEvent event={null} />)
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'Birthday' },
  })
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Show progress to next anniversary' }),
  )
  fireEvent.submit(document.getElementById('event-form')!)
  await waitFor(() => expect(navigation.push).toHaveBeenCalled())
  const saved = (await db.events.toArray())[0]
  expect(saved.anniversaryProgressEnabled).toBe(true)
  unmount()
  render(<CreateOrUpdateEvent event={(await getEvent(saved.id))!} />)
  const checkbox = screen.getByRole('checkbox', {
    name: 'Show progress to next anniversary',
  })
  expect(checkbox.getAttribute('aria-checked')).toBe('true')
  fireEvent.click(checkbox)
  navigation.push.mockClear()
  fireEvent.submit(document.getElementById('event-form')!)
  await waitFor(() => expect(navigation.push).toHaveBeenCalled())
  expect((await getEvent(saved.id))?.anniversaryProgressEnabled).toBe(false)
})
