import { ALL_TAG_ID, db, ensureSystemTags } from '@/helpers/indexedDB'
import type { Event, Tag, TagEventOrder } from '@/types/event'
import {
  BACKUP_SCHEMA_VERSION,
  ENCRYPTED_BACKUP_FORMAT_VERSION,
  type BackupSummary,
  type BackupV1,
  type EncryptedBackupV1,
} from '@/types/backup'

const BACKUP_FORMAT = 'track-time-encrypted-backup' as const
const PBKDF2_ITERATIONS = 310_000
const SALT_BYTES = 16
const IV_BYTES = 12
const MINIMUM_PASSWORD_LENGTH = 8

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const requireRecord = (
  value: unknown,
  label: string,
): Record<string, unknown> => {
  if (!isRecord(value)) throw new Error(`${label} must be an object`)
  return value
}

const requireString = (value: unknown, label: string) => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`)
  }
  return value
}

const requireBoolean = (value: unknown, label: string) => {
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`)
  return value
}

const requireIsoDate = (value: unknown, label: string) => {
  const date = requireString(value, label)
  if (!Number.isFinite(Date.parse(date))) {
    throw new Error(`${label} must be a valid ISO date`)
  }
  return date
}

const parseEvent = (value: unknown, index: number): Event => {
  const item = requireRecord(value, `Event ${index + 1}`)
  const prefix = `Event ${index + 1}`

  return {
    id: requireString(item.id, `${prefix} id`),
    title: requireString(item.title, `${prefix} title`),
    datetime: requireIsoDate(item.datetime, `${prefix} datetime`),
    seconds: requireBoolean(item.seconds, `${prefix} seconds`),
    minutes: requireBoolean(item.minutes, `${prefix} minutes`),
    hours: requireBoolean(item.hours, `${prefix} hours`),
    days: requireBoolean(item.days, `${prefix} days`),
    months: requireBoolean(item.months, `${prefix} months`),
    years: requireBoolean(item.years, `${prefix} years`),
    createdAt: requireIsoDate(item.createdAt, `${prefix} createdAt`),
    updatedAt: requireIsoDate(item.updatedAt, `${prefix} updatedAt`),
  }
}

const parseTag = (value: unknown, index: number): Tag => {
  const item = requireRecord(value, `Tag ${index + 1}`)
  const prefix = `Tag ${index + 1}`

  return {
    id: requireString(item.id, `${prefix} id`),
    name: requireString(item.name, `${prefix} name`),
    system: requireBoolean(item.system, `${prefix} system`),
    createdAt: requireIsoDate(item.createdAt, `${prefix} createdAt`),
    updatedAt: requireIsoDate(item.updatedAt, `${prefix} updatedAt`),
  }
}

const parseTagEventOrder = (value: unknown, index: number): TagEventOrder => {
  const item = requireRecord(value, `Assignment ${index + 1}`)
  const prefix = `Assignment ${index + 1}`
  const sortOrder = item.sortOrder
  if (!Number.isInteger(sortOrder) || (sortOrder as number) < 0) {
    throw new Error(`${prefix} sortOrder must be a non-negative integer`)
  }

  return {
    id: requireString(item.id, `${prefix} id`),
    tagId: requireString(item.tagId, `${prefix} tagId`),
    eventId: requireString(item.eventId, `${prefix} eventId`),
    sortOrder: sortOrder as number,
    createdAt: requireIsoDate(item.createdAt, `${prefix} createdAt`),
    updatedAt: requireIsoDate(item.updatedAt, `${prefix} updatedAt`),
  }
}

const requireUnique = (values: string[], label: string) => {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value))
      throw new Error(`${label} contains duplicate “${value}”`)
    seen.add(value)
  }
}

export const validateBackup = (value: unknown): BackupV1 => {
  const root = requireRecord(value, 'Backup')
  if (root.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported backup schema version: ${String(root.schemaVersion)}`,
    )
  }

  const exportedAt = requireIsoDate(root.exportedAt, 'Backup exportedAt')
  const data = requireRecord(root.data, 'Backup data')
  if (!Array.isArray(data.events))
    throw new Error('Backup events must be an array')
  if (!Array.isArray(data.tags)) throw new Error('Backup tags must be an array')
  if (!Array.isArray(data.tagEventOrder)) {
    throw new Error('Backup assignments must be an array')
  }

  const events = data.events.map(parseEvent)
  const tags = data.tags.map(parseTag)
  const tagEventOrder = data.tagEventOrder.map(parseTagEventOrder)

  requireUnique(
    events.map(({ id }) => id),
    'Event IDs',
  )
  requireUnique(
    tags.map(({ id }) => id),
    'Tag IDs',
  )
  requireUnique(
    tags.map(({ name }) => name.trim().toLocaleLowerCase()),
    'Tag names',
  )
  requireUnique(
    tagEventOrder.map(({ id }) => id),
    'Assignment IDs',
  )
  requireUnique(
    tagEventOrder.map(({ tagId, eventId }) => `${tagId}:${eventId}`),
    'Event-to-tag assignments',
  )
  requireUnique(
    tagEventOrder.map(({ tagId, sortOrder }) => `${tagId}:${sortOrder}`),
    'Per-tag sort positions',
  )

  const allTag = tags.find(({ id }) => id === ALL_TAG_ID)
  if (!allTag || allTag.name !== 'All' || !allTag.system) {
    throw new Error('Backup is missing the required “All” system tag')
  }
  if (tags.some(({ id, system }) => system && id !== ALL_TAG_ID)) {
    throw new Error('Backup contains an unsupported system tag')
  }

  const eventIds = new Set(events.map(({ id }) => id))
  const tagIds = new Set(tags.map(({ id }) => id))
  for (const assignment of tagEventOrder) {
    if (!eventIds.has(assignment.eventId)) {
      throw new Error(
        `Assignment references unknown event “${assignment.eventId}”`,
      )
    }
    if (!tagIds.has(assignment.tagId)) {
      throw new Error(`Assignment references unknown tag “${assignment.tagId}”`)
    }
    if (assignment.id !== `${assignment.tagId}:${assignment.eventId}`) {
      throw new Error(`Assignment “${assignment.id}” has an invalid id`)
    }
  }

  const allAssignments = new Set(
    tagEventOrder
      .filter(({ tagId }) => tagId === ALL_TAG_ID)
      .map(({ eventId }) => eventId),
  )
  if (events.some(({ id }) => !allAssignments.has(id))) {
    throw new Error('Every event must be assigned to the “All” system tag')
  }

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt,
    data: { events, tags, tagEventOrder },
  }
}

export const summarizeBackup = (backup: BackupV1): BackupSummary => ({
  exportedAt: backup.exportedAt,
  eventCount: backup.data.events.length,
  customTagCount: backup.data.tags.filter(({ system }) => !system).length,
  systemTagCount: backup.data.tags.filter(({ system }) => system).length,
  assignmentCount: backup.data.tagEventOrder.length,
})

export const createBackup = async (): Promise<BackupV1> => {
  await ensureSystemTags()
  const data = await db.transaction(
    'r',
    db.events,
    db.tags,
    db.tagEventOrder,
    async () => ({
      events: await db.events.toArray(),
      tags: await db.tags.toArray(),
      tagEventOrder: await db.tagEventOrder.toArray(),
    }),
  )

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

const base64ToBytes = (value: string, label: string) => {
  try {
    const binary = atob(value)
    return Uint8Array.from(binary, (character) => character.charCodeAt(0))
  } catch {
    throw new Error(`${label} is not valid base64 data`)
  }
}

const getKey = async (
  password: string,
  salt: ArrayBuffer,
  iterations: number,
) => {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

const envelopeMetadata = (
  envelope: Pick<
    EncryptedBackupV1,
    'format' | 'formatVersion' | 'backupSchemaVersion' | 'exportedAt'
  >,
) =>
  new TextEncoder().encode(
    JSON.stringify({
      format: envelope.format,
      formatVersion: envelope.formatVersion,
      backupSchemaVersion: envelope.backupSchemaVersion,
      exportedAt: envelope.exportedAt,
    }),
  )

export const encryptBackup = async (
  backup: BackupV1,
  password: string,
): Promise<EncryptedBackupV1> => {
  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters`,
    )
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await getKey(
    password,
    salt.buffer as ArrayBuffer,
    PBKDF2_ITERATIONS,
  )
  const metadata = {
    format: BACKUP_FORMAT,
    formatVersion: ENCRYPTED_BACKUP_FORMAT_VERSION,
    backupSchemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: backup.exportedAt,
  } as const
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: envelopeMetadata(metadata) },
    key,
    new TextEncoder().encode(JSON.stringify(backup)),
  )

  return {
    ...metadata,
    encryption: {
      kdf: 'PBKDF2',
      hash: 'SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
      cipher: 'AES-GCM',
      iv: bytesToBase64(iv),
    },
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }
}

const validateEnvelope = (value: unknown): EncryptedBackupV1 => {
  const root = requireRecord(value, 'Encrypted backup')
  if (root.format !== BACKUP_FORMAT) {
    throw new Error('This is not a Track Time encrypted backup')
  }
  if (root.formatVersion !== ENCRYPTED_BACKUP_FORMAT_VERSION) {
    throw new Error(
      `Unsupported encrypted backup version: ${String(root.formatVersion)}`,
    )
  }
  if (root.backupSchemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported backup schema version: ${String(root.backupSchemaVersion)}`,
    )
  }
  const encryption = requireRecord(root.encryption, 'Encryption settings')
  if (
    encryption.kdf !== 'PBKDF2' ||
    encryption.hash !== 'SHA-256' ||
    encryption.cipher !== 'AES-GCM'
  ) {
    throw new Error('The backup uses unsupported encryption settings')
  }
  if (encryption.iterations !== PBKDF2_ITERATIONS) {
    throw new Error('The backup uses invalid encryption settings')
  }

  return {
    format: BACKUP_FORMAT,
    formatVersion: ENCRYPTED_BACKUP_FORMAT_VERSION,
    backupSchemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: requireIsoDate(root.exportedAt, 'Backup exportedAt'),
    encryption: {
      kdf: 'PBKDF2',
      hash: 'SHA-256',
      iterations: encryption.iterations as number,
      salt: requireString(encryption.salt, 'Encryption salt'),
      cipher: 'AES-GCM',
      iv: requireString(encryption.iv, 'Encryption IV'),
    },
    ciphertext: requireString(root.ciphertext, 'Encrypted backup data'),
  }
}

export const decryptBackup = async (
  source: string,
  password: string,
): Promise<BackupV1> => {
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch {
    throw new Error('The selected file is not valid JSON')
  }

  const envelope = validateEnvelope(parsed)
  const salt = base64ToBytes(envelope.encryption.salt, 'Encryption salt')
  const iv = base64ToBytes(envelope.encryption.iv, 'Encryption IV')
  const ciphertext = base64ToBytes(envelope.ciphertext, 'Encrypted backup data')
  if (salt.length !== SALT_BYTES || iv.length !== IV_BYTES) {
    throw new Error('The backup uses invalid encryption settings')
  }

  let plaintext: ArrayBuffer
  try {
    const key = await getKey(
      password,
      salt.buffer as ArrayBuffer,
      envelope.encryption.iterations,
    )
    plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: envelopeMetadata(envelope),
      },
      key,
      ciphertext,
    )
  } catch {
    throw new Error(
      'Unable to unlock this backup. Check the password and file.',
    )
  }

  let decrypted: unknown
  try {
    decrypted = JSON.parse(new TextDecoder().decode(plaintext)) as unknown
  } catch {
    throw new Error('The unlocked backup does not contain valid JSON')
  }
  const backup = validateBackup(decrypted)
  if (
    backup.schemaVersion !== envelope.backupSchemaVersion ||
    backup.exportedAt !== envelope.exportedAt
  ) {
    throw new Error('Backup metadata does not match the encrypted data')
  }
  return backup
}

export const restoreBackup = async (backup: BackupV1): Promise<void> => {
  const validated = validateBackup(backup)
  await db.transaction('rw', db.events, db.tags, db.tagEventOrder, async () => {
    await Promise.all([
      db.events.clear(),
      db.tags.clear(),
      db.tagEventOrder.clear(),
    ])
    if (validated.data.events.length) {
      await db.events.bulkAdd(validated.data.events)
    }
    if (validated.data.tags.length) {
      await db.tags.bulkAdd(validated.data.tags)
    }
    if (validated.data.tagEventOrder.length) {
      await db.tagEventOrder.bulkAdd(validated.data.tagEventOrder)
    }
  })
}

export const backupFileName = (exportedAt: string) =>
  `track-time-backup-${exportedAt.replace(/[:.]/g, '-')}.json`
