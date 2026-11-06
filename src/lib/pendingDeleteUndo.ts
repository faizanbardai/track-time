import type { DeletedEventSnapshot } from '@/helpers/indexedDB'

const PENDING_DELETE_UNDO_KEY = 'track-time:pending-delete-undo'

export interface PendingDeleteUndo {
  snapshot: DeletedEventSnapshot
  expiresAt: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object'

const isDeletedEventSnapshot = (
  value: unknown,
): value is DeletedEventSnapshot => {
  if (
    !isRecord(value) ||
    !isRecord(value.event) ||
    !Array.isArray(value.orders)
  ) {
    return false
  }

  const { event } = value
  const validEvent =
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    typeof event.datetime === 'string' &&
    typeof event.seconds === 'boolean' &&
    typeof event.minutes === 'boolean' &&
    typeof event.hours === 'boolean' &&
    typeof event.days === 'boolean' &&
    typeof event.months === 'boolean' &&
    typeof event.years === 'boolean' &&
    typeof event.createdAt === 'string' &&
    typeof event.updatedAt === 'string'
  const validOrders = value.orders.every(
    (order) =>
      isRecord(order) &&
      typeof order.id === 'string' &&
      typeof order.tagId === 'string' &&
      typeof order.eventId === 'string' &&
      typeof order.sortOrder === 'number' &&
      typeof order.createdAt === 'string' &&
      typeof order.updatedAt === 'string',
  )

  return validEvent && validOrders
}

export const storePendingDeleteUndo = (
  snapshot: DeletedEventSnapshot,
  expiresAt: number,
): boolean => {
  try {
    sessionStorage.setItem(
      PENDING_DELETE_UNDO_KEY,
      JSON.stringify({ snapshot, expiresAt }),
    )
    return true
  } catch (error) {
    console.error('Unable to preserve the delete undo action', error)
    return false
  }
}

export const takePendingDeleteUndo = (): PendingDeleteUndo | null => {
  try {
    const stored = sessionStorage.getItem(PENDING_DELETE_UNDO_KEY)
    if (!stored) return null

    sessionStorage.removeItem(PENDING_DELETE_UNDO_KEY)
    const pending: unknown = JSON.parse(stored)
    if (
      !isRecord(pending) ||
      !isDeletedEventSnapshot(pending.snapshot) ||
      typeof pending.expiresAt !== 'number' ||
      !Number.isFinite(pending.expiresAt)
    ) {
      throw new Error('Invalid pending delete undo data')
    }

    if (pending.expiresAt <= Date.now()) return null

    return {
      snapshot: pending.snapshot,
      expiresAt: pending.expiresAt,
    }
  } catch (error) {
    console.error('Unable to restore the pending delete undo action', error)
    return null
  }
}
