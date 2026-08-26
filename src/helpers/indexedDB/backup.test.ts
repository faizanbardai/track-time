import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  db,
  listEventsByTag,
  listTags,
  normalizeTagKey,
  reorderTags,
  saveEvent,
} from '@/helpers/indexedDB'
import {
  createBackup,
  decryptBackup,
  encryptBackup,
  restoreBackup,
  validateBackup,
} from '@/helpers/indexedDB/backup'
import { BACKUP_SCHEMA_VERSION, type BackupV1 } from '@/types/backup'
import type { Event, Tag, TagEventOrder } from '@/types/event'

const timestamp = '2026-08-17T12:00:00.000Z'

const event = (id: string, title: string): Event => ({
  id,
  title,
  datetime: timestamp,
  seconds: true,
  minutes: true,
  hours: true,
  days: true,
  months: false,
  years: false,
  createdAt: timestamp,
  updatedAt: timestamp,
})

const tag = (id: string, name: string, system = false): Tag => ({
  id,
  name,
  system,
  createdAt: timestamp,
  updatedAt: timestamp,
})

const order = (
  tagId: string,
  eventId: string,
  sortOrder: number,
): TagEventOrder => ({
  id: `${tagId}:${eventId}`,
  tagId,
  eventId,
  sortOrder,
  createdAt: timestamp,
  updatedAt: timestamp,
})

const originalBackup = (): BackupV1 => ({
  schemaVersion: BACKUP_SCHEMA_VERSION,
  exportedAt: timestamp,
  data: {
    events: [event('old-event', 'Existing event')],
    tags: [tag('all', 'All', true)],
    tagEventOrder: [order('all', 'old-event', 0)],
  },
})

const importedBackup = (): BackupV1 => ({
  schemaVersion: BACKUP_SCHEMA_VERSION,
  exportedAt: '2026-08-17T13:00:00.000Z',
  data: {
    events: [event('event-1', 'First'), event('event-2', 'Second')],
    tags: [tag('all', 'All', true), tag('work', 'Work')],
    tagOrder: ['work'],
    tagEventOrder: [
      order('all', 'event-1', 1),
      order('all', 'event-2', 0),
      order('work', 'event-1', 0),
      order('work', 'event-2', 1),
    ],
  },
})

const seed = async (backup: BackupV1) => {
  await db.events.bulkAdd(backup.data.events)
  await db.tags.bulkAdd(backup.data.tags)
  await db.tagEventOrder.bulkAdd(backup.data.tagEventOrder)
}

const readDatabase = async () => ({
  events: await db.events.toArray(),
  tags: await db.tags.toArray(),
  tagEventOrder: await db.tagEventOrder.toArray(),
})

const readTagOrder = async () => (await db.tagOrder.get('custom'))?.tagIds

describe('backup and restore', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    await db.delete()
    await db.open()
  })

  afterAll(async () => {
    await db.delete()
  })

  it('exports every table with a schema version and timestamp', async () => {
    const source = importedBackup()
    await seed(source)

    const backup = await createBackup()

    expect(backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(Date.parse(backup.exportedAt)).not.toBeNaN()
    expect(backup.data.events).toEqual(source.data.events)
    expect(backup.data.tags).toEqual(source.data.tags)
    expect(backup.data.tagEventOrder).toEqual(source.data.tagEventOrder)
  })

  it('preserves an event end date through validation and restore', async () => {
    const source = importedBackup()
    source.data.events[0].endDate = '2026-08-20T00:00:00.000Z'

    expect(validateBackup(source).data.events[0].endDate).toBe(
      source.data.events[0].endDate,
    )

    await restoreBackup(source)

    await expect(db.events.get('event-1')).resolves.toMatchObject({
      endDate: source.data.events[0].endDate,
    })
  })

  it('preserves progress visibility through backup and restore', async () => {
    const source = importedBackup()
    source.data.events[0].progressEnabled = true
    await seed(source)

    const backup = await createBackup()

    expect(backup.data.events[0].progressEnabled).toBe(true)

    await restoreBackup(backup)

    await expect(db.events.get('event-1')).resolves.toMatchObject({
      progressEnabled: true,
    })
  })

  it('encrypts a backup and only decrypts it with the correct password', async () => {
    const source = importedBackup()
    const encrypted = await encryptBackup(
      source,
      'correct horse battery staple',
    )

    expect(JSON.stringify(encrypted)).not.toContain('First')
    await expect(
      decryptBackup(JSON.stringify(encrypted), 'wrong password'),
    ).rejects.toThrow('Check the password and file')
    await expect(
      decryptBackup(JSON.stringify(encrypted), 'correct horse battery staple'),
    ).resolves.toEqual(source)
  })

  it('rejects tampered authenticated metadata', async () => {
    const encrypted = await encryptBackup(
      importedBackup(),
      'correct horse battery staple',
    )
    encrypted.exportedAt = '2026-08-17T14:00:00.000Z'

    await expect(
      decryptBackup(JSON.stringify(encrypted), 'correct horse battery staple'),
    ).rejects.toThrow('Check the password and file')
  })

  it('rejects invalid data without changing existing records', async () => {
    const original = originalBackup()
    await seed(original)
    const invalid: unknown = { ...importedBackup(), schemaVersion: 99 }

    expect(() => validateBackup(invalid)).toThrow(
      'Unsupported backup schema version',
    )
    expect(await readDatabase()).toEqual(original.data)
  })

  it.each(['1', '2024-01-01', '2024-02-30T00:00:00.000Z'])(
    'rejects non-canonical timestamp %s',
    (datetime) => {
      const invalid = structuredClone(importedBackup())
      invalid.data.events[0].datetime = datetime

      expect(() => validateBackup(invalid)).toThrow('must be a valid ISO date')
    },
  )

  it('rejects broken references, duplicate ordering, and blank tag names', () => {
    const brokenReference = structuredClone(importedBackup())
    brokenReference.data.tagEventOrder[0].eventId = 'missing-event'
    brokenReference.data.tagEventOrder[0].id = 'all:missing-event'
    expect(() => validateBackup(brokenReference)).toThrow(
      'references unknown event',
    )

    const duplicateOrder = structuredClone(importedBackup())
    duplicateOrder.data.tagEventOrder[0].sortOrder = 0
    expect(() => validateBackup(duplicateOrder)).toThrow(
      'Per-tag sort positions contains duplicate',
    )

    const blankTag = structuredClone(importedBackup())
    blankTag.data.tags[1].name = '   '
    expect(() => validateBackup(blankTag)).toThrow('name cannot be blank')
  })

  it('normalizes tag keys independently of the browser locale', () => {
    expect(normalizeTagKey(' I ')).toBe('i')
    expect(normalizeTagKey('ı')).toBe('ı')
    expect(normalizeTagKey('Cafe\u0301')).toBe(normalizeTagKey('Café'))
  })

  it('replaces all data and preserves per-tag ordering', async () => {
    await seed(originalBackup())
    const replacement = importedBackup()

    await restoreBackup(replacement)

    expect(await readDatabase()).toEqual({
      events: replacement.data.events,
      tags: replacement.data.tags,
      tagEventOrder: replacement.data.tagEventOrder,
    })
    expect((await listEventsByTag('all')).map(({ id }) => id)).toEqual([
      'event-2',
      'event-1',
    ])
    expect((await listEventsByTag('work')).map(({ id }) => id)).toEqual([
      'event-1',
      'event-2',
    ])
    expect(await readTagOrder()).toEqual(['work'])
  })

  it('appends multiple newly created event tags without losing their order', async () => {
    await db.tags.add(tag('all', 'All', true))

    await saveEvent(event('new-event', 'New event'), ['Zulu', 'Alpha'])

    expect((await listTags()).map(({ name }) => name)).toEqual([
      'All',
      'Zulu',
      'Alpha',
    ])
  })

  it('persists an explicitly reordered tag list', async () => {
    await db.tags.bulkAdd([
      tag('all', 'All', true),
      tag('first', 'First'),
      tag('second', 'Second'),
    ])

    await listTags()
    await reorderTags(['second', 'first'])

    expect((await listTags()).map(({ id }) => id)).toEqual([
      'all',
      'second',
      'first',
    ])
  })

  it('falls back to alphabetical order for legacy backups', async () => {
    const legacy = importedBackup()
    delete legacy.data.tagOrder
    legacy.data.tags.push(tag('personal', 'Personal'))

    await restoreBackup(legacy)

    expect(await readTagOrder()).toEqual(['personal', 'work'])
  })

  it('rolls back every table when a write fails mid-restore', async () => {
    const original = originalBackup()
    await seed(original)
    vi.spyOn(db.tagEventOrder, 'bulkAdd').mockRejectedValueOnce(
      new Error('simulated write failure'),
    )

    await expect(restoreBackup(importedBackup())).rejects.toThrow(
      'simulated write failure',
    )

    expect(await readDatabase()).toEqual(original.data)
  })
})
