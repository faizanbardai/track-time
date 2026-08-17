import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, listEventsByTag } from '@/helpers/indexedDB'
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

  it('rejects invalid data without changing existing records', async () => {
    const original = originalBackup()
    await seed(original)
    const invalid: unknown = { ...importedBackup(), schemaVersion: 99 }

    expect(() => validateBackup(invalid)).toThrow(
      'Unsupported backup schema version',
    )
    expect(await readDatabase()).toEqual(original.data)
  })

  it('replaces all data and preserves per-tag ordering', async () => {
    await seed(originalBackup())
    const replacement = importedBackup()

    await restoreBackup(replacement)

    expect(await readDatabase()).toEqual(replacement.data)
    expect((await listEventsByTag('all')).map(({ id }) => id)).toEqual([
      'event-2',
      'event-1',
    ])
    expect((await listEventsByTag('work')).map(({ id }) => id)).toEqual([
      'event-1',
      'event-2',
    ])
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
