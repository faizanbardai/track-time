// @vitest-environment jsdom

import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { clearDemoData, loadDemoData } from '@/helpers/indexedDB/demoData'
import { db, normalizeTagKey } from '@/helpers/indexedDB'
import type { Event, Tag, TagEventOrder } from '@/types/event'

describe('demo data', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  afterAll(async () => {
    await db.delete()
  })

  it('reuses and preserves an existing case-insensitive demo tag', async () => {
    const personalTag = {
      id: 'personal-tag',
      name: 'personal',
      system: false,
      createdAt: '2026-08-17T12:00:00.000Z',
      updatedAt: '2026-08-17T12:00:00.000Z',
    }
    await db.tags.add(personalTag)

    await loadDemoData()

    const matchingTags = (await db.tags.toArray()).filter(
      (tag) => normalizeTagKey(tag.name) === normalizeTagKey('Personal'),
    )
    expect(matchingTags).toEqual([personalTag])

    const event = (await db.events.toArray()).find(
      ({ title }) => title === 'Moved into my first home',
    )
    expect(event).toBeDefined()
    if (!event) throw new Error('Expected demo event to be loaded')
    const assignments = await db.tagEventOrder
      .where('eventId')
      .equals(event.id)
      .toArray()
    expect(assignments.some(({ tagId }) => tagId === personalTag.id)).toBe(true)

    await clearDemoData()

    expect(await db.tags.get(personalTag.id)).toEqual(personalTag)
    expect(await db.events.count()).toBe(0)
  })

  it('preserves user records with legacy demo ID prefixes', async () => {
    const timestamp = '2026-08-17T12:00:00.000Z'
    const tag: Tag = {
      id: 'demo-tag:custom',
      name: 'Custom',
      system: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const event: Event = {
      id: 'demo-event:custom',
      title: 'User event',
      datetime: timestamp,
      seconds: true,
      minutes: true,
      hours: true,
      days: true,
      months: false,
      years: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const assignment: TagEventOrder = {
      id: `${tag.id}:${event.id}`,
      tagId: tag.id,
      eventId: event.id,
      sortOrder: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await db.tags.add(tag)
    await db.events.add(event)
    await db.tagEventOrder.add(assignment)

    await loadDemoData()
    await clearDemoData()

    expect(await db.tags.get(tag.id)).toEqual(tag)
    expect(await db.events.get(event.id)).toEqual(event)
    expect(await db.tagEventOrder.get(assignment.id)).toEqual(assignment)
  })
})
