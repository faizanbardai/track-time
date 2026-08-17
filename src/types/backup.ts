import type { Event, Tag, TagEventOrder } from '@/types/event'

export const BACKUP_SCHEMA_VERSION = 1 as const
export const ENCRYPTED_BACKUP_FORMAT_VERSION = 1 as const

export interface BackupV1 {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION
  exportedAt: string
  data: {
    events: Event[]
    tags: Tag[]
    tagEventOrder: TagEventOrder[]
  }
}

export interface EncryptedBackupV1 {
  format: 'track-time-encrypted-backup'
  formatVersion: typeof ENCRYPTED_BACKUP_FORMAT_VERSION
  backupSchemaVersion: typeof BACKUP_SCHEMA_VERSION
  exportedAt: string
  encryption: {
    kdf: 'PBKDF2'
    hash: 'SHA-256'
    iterations: number
    salt: string
    cipher: 'AES-GCM'
    iv: string
  }
  ciphertext: string
}

export interface BackupSummary {
  exportedAt: string
  eventCount: number
  customTagCount: number
  systemTagCount: number
  assignmentCount: number
}
