import dayjs, { type Dayjs } from 'dayjs'
import { v5 as uuidv5 } from 'uuid'
import { parseEventInput } from '@/helpers/datetime/eventTiming'
import type { Event, Tag, TagEventOrder } from '@/types/event'
import {
  ALL_TAG_ID,
  clearCachedEvent,
  DATA_CHANGED_EVENT,
  db,
  ensureSystemTags,
  normalizeTagKey,
} from './index'

const DEMO_UUID_NAMESPACE = 'b0317375-35b4-5e10-9f4b-9a565c281fb5'
const DEMO_EVENT_KEYS = [
  'anniversary',
  'upcoming-date',
  'active-date-range',
  'completed-date-range',
  'upcoming-timed-date',
  'active-timed-range',
  'past-timed-date',
] as const
const DEMO_TAG_NAMES = ['Personal', 'Travel', 'Work', 'Milestone', 'Learning']
const demoEventId = (key: (typeof DEMO_EVENT_KEYS)[number]) =>
  uuidv5(`track-time:event:${key}`, DEMO_UUID_NAMESPACE)
const demoTagId = (index: number) =>
  uuidv5(`track-time:tag:${index}`, DEMO_UUID_NAMESPACE)
const DEMO_EVENT_IDS = new Set(DEMO_EVENT_KEYS.map(demoEventId))
const DEMO_TAG_IDS = new Set(DEMO_TAG_NAMES.map((_, index) => demoTagId(index)))

const isDemoEventId = (id: string) => DEMO_EVENT_IDS.has(id)
const isDemoTagId = (id: string) => DEMO_TAG_IDS.has(id)

const toTimedDate = (date: string, time: string, zone: string) =>
  parseEventInput(date, time, zone).toISOString()

const makeDemoEvents = (now: Dayjs, timestamp: string): Event[] => {
  const pastAnniversary = now.subtract(180, 'day').format('YYYY-MM-DD')
  const nextDate = now.add(45, 'day').format('YYYY-MM-DD')
  const rangeStart = now.subtract(2, 'day').format('YYYY-MM-DD')
  const rangeEnd = now.add(5, 'day').format('YYYY-MM-DD')
  const completedEnd = now.subtract(1, 'year').subtract(4, 'month')
  const completedStart = completedEnd.subtract(3, 'year').add(1, 'day')
  const timedStart = now.subtract(1, 'day').format('YYYY-MM-DD')
  const timedEnd = now.add(2, 'day').format('YYYY-MM-DD')
  const timedPast = now.subtract(60, 'day').format('YYYY-MM-DD')
  const timedFuture = now.add(10, 'day').format('YYYY-MM-DD')

  const common = {
    seconds: false,
    minutes: false,
    hours: false,
    days: true,
    months: true,
    years: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return [
    {
      ...common,
      id: demoEventId('anniversary'),
      title: 'Moved into my first home',
      datetime: pastAnniversary,
      dateOnly: true,
      anniversaryProgressEnabled: true,
    },
    {
      ...common,
      id: demoEventId('upcoming-date'),
      title: 'Winter break',
      datetime: nextDate,
      dateOnly: true,
    },
    {
      ...common,
      id: demoEventId('active-date-range'),
      title: 'A week in the mountains',
      datetime: rangeStart,
      endDate: rangeEnd,
      dateOnly: true,
    },
    {
      ...common,
      id: demoEventId('completed-date-range'),
      title: "Bachelor's degree",
      datetime: completedStart.format('YYYY-MM-DD'),
      endDate: completedEnd.format('YYYY-MM-DD'),
      dateOnly: true,
      anniversaryProgressEnabled: true,
    },
    {
      ...common,
      id: demoEventId('upcoming-timed-date'),
      title: 'Product launch in Berlin',
      datetime: toTimedDate(timedFuture, '14:30', 'Europe/Berlin'),
      dateOnly: false,
      timeZone: 'Europe/Berlin',
      seconds: true,
      minutes: true,
      hours: true,
    },
    {
      ...common,
      id: demoEventId('active-timed-range'),
      title: 'Global design summit',
      datetime: toTimedDate(timedStart, '09:00', 'Europe/Berlin'),
      endDate: toTimedDate(timedEnd, '17:00', 'America/New_York'),
      dateOnly: false,
      timeZone: 'Europe/Berlin',
      endTimeZone: 'America/New_York',
      seconds: true,
      minutes: true,
      hours: true,
    },
    {
      ...common,
      id: demoEventId('past-timed-date'),
      title: 'A late summer evening',
      datetime: toTimedDate(timedPast, '20:15', 'Europe/Paris'),
      dateOnly: false,
      timeZone: 'Europe/Paris',
      seconds: true,
      minutes: true,
      hours: true,
    },
  ]
}

const getDemoEventIds = async () =>
  (await db.events.toArray())
    .filter((event) => isDemoEventId(event.id))
    .map((event) => event.id)

export const getDemoEventCount = async () => (await getDemoEventIds()).length

export const loadDemoData = async () => {
  await ensureSystemTags()

  await db.transaction(
    'rw',
    db.events,
    db.tags,
    db.tagEventOrder,
    db.tagOrder,
    async () => {
      const existingEvents = await getDemoEventIds()
      if (existingEvents.length > 0) return

      const timestamp = new Date().toISOString()
      const demoTags: Tag[] = []
      const tagsByName = new Map(
        (await db.tags.toArray()).map((tag) => [
          normalizeTagKey(tag.name),
          tag,
        ]),
      )
      for (const [index, name] of DEMO_TAG_NAMES.entries()) {
        const existing = tagsByName.get(normalizeTagKey(name))
        if (existing) {
          continue
        }

        const id = demoTagId(index)
        const existingById = await db.tags.get(id)
        if (existingById && existingById.name !== name) {
          throw new Error('Cannot load demo data: a demo identifier is in use')
        }

        const tag: Tag = {
          id,
          name,
          system: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        demoTags.push(tag)
        tagsByName.set(normalizeTagKey(name), tag)
      }

      await db.tags.bulkPut(demoTags)

      const tagOrder = await db.tagOrder.get('custom')
      const orderedTagIds = tagOrder?.tagIds ?? []
      await db.tagOrder.put({
        id: 'custom',
        tagIds: [
          ...orderedTagIds,
          ...demoTags
            .map(({ id }) => id)
            .filter((id) => !orderedTagIds.includes(id)),
        ],
      })

      const events = makeDemoEvents(dayjs(), timestamp)
      const tagNamesByEvent = [
        ['Personal', 'Milestone'],
        ['Travel'],
        ['Travel'],
        ['Milestone', 'Learning'],
        ['Work'],
        ['Work', 'Travel'],
        ['Personal'],
      ]
      const currentOrders = await db.tagEventOrder.toArray()
      const nextOrder = new Map<string, number>()
      for (const order of currentOrders) {
        nextOrder.set(
          order.tagId,
          Math.max(nextOrder.get(order.tagId) ?? 0, order.sortOrder + 1),
        )
      }

      const assignments: TagEventOrder[] = []
      for (const [index, event] of events.entries()) {
        const assignedTags = [
          await db.tags.get(ALL_TAG_ID),
          ...tagNamesByEvent[index].map((name) =>
            tagsByName.get(normalizeTagKey(name)),
          ),
        ].filter((tag): tag is Tag => Boolean(tag))

        for (const tag of assignedTags) {
          const sortOrder = nextOrder.get(tag.id) ?? 0
          assignments.push({
            id: `${tag.id}:${event.id}`,
            tagId: tag.id,
            eventId: event.id,
            sortOrder,
            createdAt: timestamp,
            updatedAt: timestamp,
          })
          nextOrder.set(tag.id, sortOrder + 1)
        }
      }

      await db.events.bulkPut(events)
      await db.tagEventOrder.bulkPut(assignments)
    },
  )

  window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
}

export const clearDemoData = async () => {
  let deletedEventIds: string[] = []

  await db.transaction(
    'rw',
    db.events,
    db.tags,
    db.tagEventOrder,
    db.tagOrder,
    async () => {
      deletedEventIds = await getDemoEventIds()
      const demoEvents = new Set(deletedEventIds)
      const assignments = await db.tagEventOrder.toArray()
      const demoAssignments = assignments.filter((assignment) =>
        demoEvents.has(assignment.eventId),
      )
      const remainingAssignments = assignments.filter(
        (assignment) => !demoEvents.has(assignment.eventId),
      )
      const demoTags = (await db.tags.toArray()).filter((tag) =>
        isDemoTagId(tag.id),
      )
      const unusedDemoTags = demoTags.filter(
        (tag) => !remainingAssignments.some((item) => item.tagId === tag.id),
      )
      const unusedTagIds = new Set(unusedDemoTags.map(({ id }) => id))

      await db.events.bulkDelete(deletedEventIds)
      await db.tagEventOrder.bulkDelete(demoAssignments.map(({ id }) => id))
      await db.tags.bulkDelete([...unusedTagIds])

      const tagOrder = await db.tagOrder.get('custom')
      if (tagOrder) {
        await db.tagOrder.put({
          id: 'custom',
          tagIds: tagOrder.tagIds.filter((id) => !unusedTagIds.has(id)),
        })
      }
    },
  )

  for (const eventId of deletedEventIds) clearCachedEvent(eventId)
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
}
