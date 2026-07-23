import Dexie, { type Table } from 'dexie'
import { Event } from '@/types/event'

export type EventDraft = Omit<Event, 'createdAt' | 'sortOrder' | 'updatedAt'> &
  Partial<Pick<Event, 'createdAt' | 'sortOrder' | 'updatedAt'>>

class TrackTimeDB extends Dexie {
  events!: Table<Event, string>

  constructor() {
    super('track-time-local')

    this.version(1).stores({
      events: '&id, sortOrder, createdAt, updatedAt',
    })
  }
}

export const db = new TrackTimeDB()

const sortEvents = (events: Event[]) => {
  return [...events].sort((first, second) => {
    if (first.sortOrder !== second.sortOrder) {
      return first.sortOrder - second.sortOrder
    }

    return first.createdAt.localeCompare(second.createdAt)
  })
}

const getNextSortOrder = async () => {
  const lastEvent = await db.events.orderBy('sortOrder').last()
  return lastEvent ? lastEvent.sortOrder + 1 : 0
}

export const listEvents = async (): Promise<Event[]> => {
  const events = await db.events.toArray()
  return sortEvents(events)
}

export const getEvent = async (eventId: string): Promise<Event | null> => {
  return (await db.events.get(eventId)) ?? null
}

export const saveEvent = async (event: EventDraft): Promise<string> => {
  return db.transaction('rw', db.events, async () => {
    const existing = await db.events.get(event.id)
    const now = new Date().toISOString()
    const eventToSave: Event = {
      ...event,
      createdAt: existing?.createdAt ?? event.createdAt ?? now,
      sortOrder:
        existing?.sortOrder ?? event.sortOrder ?? (await getNextSortOrder()),
      updatedAt: now,
    }

    await db.events.put(eventToSave)
    return event.id
  })
}

export const deleteEvent = async (eventId: string): Promise<void> => {
  await db.events.delete(eventId)
}

export const reorderEvents = async (eventIds: string[]): Promise<void> => {
  const now = new Date().toISOString()

  await db.transaction('rw', db.events, async () => {
    await Promise.all(
      eventIds.map((eventId, sortOrder) => {
        return db.events.update(eventId, { sortOrder, updatedAt: now })
      }),
    )
  })
}
