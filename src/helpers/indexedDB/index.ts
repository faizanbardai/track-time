import Dexie, { type Table } from 'dexie'
import { v4 as uuid } from 'uuid'
import {
  Event,
  EventWithTags,
  Tag,
  TagEventOrder,
  TagOrder,
  TagWithUsage,
} from '@/types/event'

export type EventDraft = Omit<Event, 'createdAt' | 'updatedAt'> &
  Partial<Pick<Event, 'createdAt' | 'updatedAt'>>

export const ALL_TAG_ID = 'all'
export const UPCOMING_TAG_ID = 'upcoming'

const ALL_TAG_NAME = 'All'

const getTagEventOrderId = (tagId: string, eventId: string) => {
  return `${tagId}:${eventId}`
}

class TrackTimeDB extends Dexie {
  events!: Table<Event, string>
  tags!: Table<Tag, string>
  tagEventOrder!: Table<TagEventOrder, string>
  tagOrder!: Table<TagOrder, string>

  constructor() {
    super('track-time-local')

    this.version(2).stores({
      events: '&id, datetime, createdAt, updatedAt',
      tags: '&id, &name, system, createdAt, updatedAt',
      tagEventOrder:
        '&id, tagId, eventId, [tagId+sortOrder], [tagId+eventId], createdAt, updatedAt',
    })
    this.version(3).stores({
      events: '&id, datetime, createdAt, updatedAt',
      tags: '&id, &name, system, createdAt, updatedAt',
      tagEventOrder:
        '&id, tagId, eventId, [tagId+sortOrder], [tagId+eventId], createdAt, updatedAt',
      tagOrder: '&id',
    })
  }
}

export const db = new TrackTimeDB()

const normalizeTagName = (name: string) => name.trim().normalize('NFC')

export const normalizeTagKey = (name: string) =>
  normalizeTagName(name).toLowerCase()

const validateTagName = (name: string) => {
  const normalized = normalizeTagName(name)

  if (!normalized) throw new Error('Tag name cannot be empty')
  if (normalizeTagKey(normalized) === normalizeTagKey(ALL_TAG_NAME)) {
    throw new Error(`“${ALL_TAG_NAME}” is reserved for the system tag`)
  }

  return normalized
}

const normalizeTagNames = (tagNames: string[]) => {
  const seen = new Set<string>()
  return tagNames.reduce<string[]>((normalizedNames, tagName) => {
    const normalized = normalizeTagName(tagName)
    const key = normalizeTagKey(normalized)

    if (!normalized || key === normalizeTagKey(ALL_TAG_NAME) || seen.has(key)) {
      return normalizedNames
    }

    seen.add(key)
    return [...normalizedNames, normalized]
  }, [])
}

export const parseTagNames = (tags: string) => {
  return normalizeTagNames(tags.split(','))
}

export const formatTagNames = (tags: Tag[]) => {
  return tags
    .filter((tag) => tag.id !== ALL_TAG_ID)
    .map((tag) => tag.name)
    .join(', ')
}

export const ensureSystemTags = async (): Promise<Tag> => {
  const existing = await db.tags.get(ALL_TAG_ID)
  const now = new Date().toISOString()

  if (existing) return existing

  const allTag: Tag = {
    id: ALL_TAG_ID,
    name: ALL_TAG_NAME,
    system: true,
    createdAt: now,
    updatedAt: now,
  }

  await db.tags.put(allTag)
  return allTag
}

const sortTagsAlphabetically = (tags: Tag[]) =>
  [...tags].sort((first, second) => first.name.localeCompare(second.name))

const getCustomTagOrder = async (tags: Tag[]) => {
  const customTags = tags.filter((tag) => !tag.system)
  const saved = await db.tagOrder.get('custom')
  const customIds = new Set(customTags.map((tag) => tag.id))
  const savedIds = saved?.tagIds.filter((id) => customIds.has(id)) ?? []
  const savedIdSet = new Set(savedIds)
  const missingTags = sortTagsAlphabetically(
    customTags.filter((tag) => !savedIdSet.has(tag.id)),
  )
  const tagIds = [...savedIds, ...missingTags.map((tag) => tag.id)]

  if (!saved || tagIds.length !== saved.tagIds.length) {
    await db.tagOrder.put({ id: 'custom', tagIds })
  }
  return tagIds
}

export const reorderTags = async (tagIds: string[]) => {
  await db.tagOrder.put({ id: 'custom', tagIds })
}

const appendTagToOrder = async (tagId: string) => {
  const order = await db.tagOrder.get('custom')
  await db.tagOrder.put({
    id: 'custom',
    tagIds: [...(order?.tagIds ?? []), tagId],
  })
}

const getNextSortOrder = async (tagId: string) => {
  const lastOrder = await db.tagEventOrder
    .where('[tagId+sortOrder]')
    .between([tagId, Dexie.minKey], [tagId, Dexie.maxKey])
    .last()

  return lastOrder ? lastOrder.sortOrder + 1 : 0
}

const getOrCreateTags = async (tagNames: string[]) => {
  const now = new Date().toISOString()
  const normalizedNames = normalizeTagNames(tagNames)
  const existingTags = await db.tags.toArray()
  const tagsByName = new Map(
    existingTags.map((tag) => [normalizeTagKey(tag.name), tag]),
  )

  const tags: Tag[] = []
  for (const tagName of normalizedNames) {
    const existing = tagsByName.get(normalizeTagKey(tagName))
    if (existing) {
      tags.push(existing)
      continue
    }

    const tag: Tag = {
      id: uuid(),
      name: tagName,
      system: false,
      createdAt: now,
      updatedAt: now,
    }

    await db.tags.add(tag)
    await appendTagToOrder(tag.id)
    tags.push(tag)
  }

  return [await ensureSystemTags(), ...tags]
}

const assignEventToTagIds = async (eventId: string, tagIds: string[]) => {
  const now = new Date().toISOString()
  const tagIdsToAssign = Array.from(new Set([ALL_TAG_ID, ...tagIds]))
  const existingOrders = await db.tagEventOrder
    .where('eventId')
    .equals(eventId)
    .toArray()
  const existingTagIds = new Set(existingOrders.map((order) => order.tagId))
  const nextTagIds = new Set(tagIdsToAssign)
  const removableOrders = existingOrders.filter(
    (order) => order.tagId !== ALL_TAG_ID && !nextTagIds.has(order.tagId),
  )

  await db.tagEventOrder.bulkDelete(removableOrders.map((order) => order.id))

  await Promise.all(
    tagIdsToAssign.map(async (tagId) => {
      if (existingTagIds.has(tagId)) return

      const order: TagEventOrder = {
        id: getTagEventOrderId(tagId, eventId),
        tagId,
        eventId,
        sortOrder: await getNextSortOrder(tagId),
        createdAt: now,
        updatedAt: now,
      }

      await db.tagEventOrder.put(order)
    }),
  )
}

const attachTagsToEvents = async (
  events: Event[],
): Promise<EventWithTags[]> => {
  if (events.length === 0) return []

  const eventIds = events.map((event) => event.id)
  const orders = await db.tagEventOrder
    .where('eventId')
    .anyOf(eventIds)
    .toArray()
  const tags = await listTags()
  const tagsById = new Map(
    tags.filter((tag): tag is Tag => Boolean(tag)).map((tag) => [tag.id, tag]),
  )
  const tagOrder = tags.filter(({ system }) => !system).map(({ id }) => id)
  const tagOrderIndex = new Map(tagOrder.map((tagId, index) => [tagId, index]))
  const tagsByEventId = orders.reduce<Map<string, Tag[]>>((map, order) => {
    const tag = tagsById.get(order.tagId)
    if (!tag) return map

    map.set(order.eventId, [...(map.get(order.eventId) ?? []), tag])
    return map
  }, new Map())

  return events.map((event) => ({
    ...event,
    tags: (tagsByEventId.get(event.id) ?? []).sort((first, second) => {
      if (first.system !== second.system) return first.system ? -1 : 1
      return (
        (tagOrderIndex.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
        (tagOrderIndex.get(second.id) ?? Number.MAX_SAFE_INTEGER)
      )
    }),
  }))
}

export const listTags = async (): Promise<Tag[]> => {
  await ensureSystemTags()
  const tags = await db.tags.toArray()
  const customTagIds = await getCustomTagOrder(tags)
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]))
  return [
    tagsById.get(ALL_TAG_ID),
    ...customTagIds.map((id) => tagsById.get(id)),
  ].filter((tag): tag is Tag => Boolean(tag))
}

export const listTagsWithUsage = async (): Promise<TagWithUsage[]> => {
  const [tags, assignments] = await Promise.all([
    listTags(),
    db.tagEventOrder.toArray(),
  ])
  const counts = assignments.reduce<Map<string, number>>((result, item) => {
    result.set(item.tagId, (result.get(item.tagId) ?? 0) + 1)
    return result
  }, new Map())

  return tags.map((tag) => ({
    ...tag,
    eventCount: counts.get(tag.id) ?? 0,
  }))
}

export const createTag = async (name: string): Promise<Tag> => {
  const normalized = validateTagName(name)

  return db.transaction('rw', db.tags, db.tagOrder, async () => {
    const tags = await db.tags.toArray()
    const existing = tags.find(
      (tag) => normalizeTagKey(tag.name) === normalizeTagKey(normalized),
    )
    if (existing) return existing

    const now = new Date().toISOString()
    const tag: Tag = {
      id: uuid(),
      name: normalized,
      system: false,
      createdAt: now,
      updatedAt: now,
    }
    await db.tags.add(tag)
    await appendTagToOrder(tag.id)
    return tag
  })
}

export const renameTag = async (tagId: string, name: string): Promise<void> => {
  if (tagId === ALL_TAG_ID) throw new Error('The system tag cannot be renamed')
  const normalized = validateTagName(name)

  await db.transaction('rw', db.tags, async () => {
    const tag = await db.tags.get(tagId)
    if (!tag) throw new Error('Tag not found')
    if (tag.system) throw new Error('System tags cannot be renamed')

    const tags = await db.tags.toArray()
    const duplicate = tags.find(
      (candidate) =>
        candidate.id !== tagId &&
        normalizeTagKey(candidate.name) === normalizeTagKey(normalized),
    )
    if (duplicate)
      throw new Error(`A tag named “${duplicate.name}” already exists`)

    await db.tags.update(tagId, {
      name: normalized,
      updatedAt: new Date().toISOString(),
    })
  })
}

export const deleteTag = async (tagId: string): Promise<void> => {
  if (tagId === ALL_TAG_ID) throw new Error('The system tag cannot be deleted')

  await db.transaction(
    'rw',
    db.tags,
    db.tagEventOrder,
    db.tagOrder,
    async () => {
      const tag = await db.tags.get(tagId)
      if (!tag) return
      if (tag.system) throw new Error('System tags cannot be deleted')

      const assignments = await db.tagEventOrder
        .where('tagId')
        .equals(tagId)
        .toArray()
      await db.tagEventOrder.bulkDelete(assignments.map((item) => item.id))
      await db.tags.delete(tagId)
      const order = await db.tagOrder.get('custom')
      if (order) {
        await db.tagOrder.put({
          id: 'custom',
          tagIds: order.tagIds.filter((id) => id !== tagId),
        })
      }
    },
  )
}

export const listEventsByTag = async (
  tagId = ALL_TAG_ID,
): Promise<EventWithTags[]> => {
  await ensureSystemTags()
  const orderedEventIds = await db.tagEventOrder
    .where('[tagId+sortOrder]')
    .between([tagId, Dexie.minKey], [tagId, Dexie.maxKey])
    .toArray()
  const events = await db.events.bulkGet(
    orderedEventIds.map((order) => order.eventId),
  )
  const eventsById = new Map(
    events
      .filter((event): event is Event => Boolean(event))
      .map((event) => [event.id, event]),
  )
  const sortedEvents = orderedEventIds
    .map((order) => eventsById.get(order.eventId))
    .filter((event): event is Event => Boolean(event))

  return attachTagsToEvents(sortedEvents)
}

export const listUpcomingEvents = async (
  now = new Date(),
): Promise<EventWithTags[]> => {
  const events = await db.events
    .where('datetime')
    .above(now.toISOString())
    .sortBy('datetime')

  return attachTagsToEvents(events)
}

export const listEvents = async (): Promise<EventWithTags[]> => {
  return listEventsByTag(ALL_TAG_ID)
}

export const getEvent = async (
  eventId: string,
): Promise<EventWithTags | null> => {
  const event = await db.events.get(eventId)
  if (!event) return null

  const [eventWithTags] = await attachTagsToEvents([event])
  return eventWithTags
}

export const saveEvent = async (
  event: EventDraft,
  tagNames: string[] = [],
): Promise<string> => {
  return db.transaction(
    'rw',
    db.events,
    db.tags,
    db.tagEventOrder,
    db.tagOrder,
    async () => {
      const existing = await db.events.get(event.id)
      const now = new Date().toISOString()
      const eventToSave: Event = {
        ...event,
        createdAt: existing?.createdAt ?? event.createdAt ?? now,
        updatedAt: now,
      }
      const tags = await getOrCreateTags(tagNames)

      await db.events.put(eventToSave)
      await assignEventToTagIds(
        event.id,
        tags.map((tag) => tag.id),
      )

      return event.id
    },
  )
}

export const deleteEvent = async (eventId: string): Promise<void> => {
  await db.transaction('rw', db.events, db.tagEventOrder, async () => {
    const orders = await db.tagEventOrder
      .where('eventId')
      .equals(eventId)
      .toArray()
    await db.tagEventOrder.bulkDelete(orders.map((order) => order.id))
    await db.events.delete(eventId)
  })
}

export const reorderEventsInTag = async (
  tagId: string,
  eventIds: string[],
): Promise<void> => {
  const now = new Date().toISOString()

  await db.transaction('rw', db.tagEventOrder, async () => {
    await Promise.all(
      eventIds.map((eventId, sortOrder) => {
        return db.tagEventOrder.update(getTagEventOrderId(tagId, eventId), {
          sortOrder,
          updatedAt: now,
        })
      }),
    )
  })
}

export const reorderEvents = async (eventIds: string[]): Promise<void> => {
  return reorderEventsInTag(ALL_TAG_ID, eventIds)
}
