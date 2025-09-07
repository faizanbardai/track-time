import { DB_NAME, DB_VERSION, EVENTS_STORE } from '@/constants/indexedDB'
import { migrateV1ToV2 } from '@/helpers/indexedDB/migrations/migrateV1ToV2'
import { migrateV2ToV3 } from '@/helpers/indexedDB/migrations/migrateV2ToV3'
import { Event } from '@/types/event'

export const createStoreAndRunMigrations = (
  request: IDBOpenDBRequest,
  event: IDBVersionChangeEvent,
) => {
  const db = request.result
  // If store doesn't exist, create it (fresh install)
  if (!db.objectStoreNames.contains(EVENTS_STORE)) {
    db.createObjectStore(EVENTS_STORE, { keyPath: 'id' })
  }

  const tx = request.transaction
  if (!tx) return

  let oldVersion = event.oldVersion

  if (oldVersion < 2) {
    migrateV1ToV2(tx)
    oldVersion = 2
  }

  if (oldVersion < 3) {
    migrateV2ToV3(tx)
    oldVersion = 3
  }
}

/**
 * Utility to open the IndexedDB and return the db instance.
 * Handles errors and version upgrades.
 */
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      createStoreAndRunMigrations(request, event)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('DB open blocked'))
  })
}

/**
 * Attach transaction error handlers and close DB on error/abort
 */

const handleTxErrors = (
  tx: IDBTransaction,
  db: IDBDatabase,
  reject: (_reason: unknown) => void,
) => {
  tx.onabort = () => {
    reject(tx.error ?? new Error('Transaction aborted'))
    db.close()
  }
  tx.onerror = () => {
    reject(tx.error ?? new Error('Transaction error'))
    db.close()
  }
}

/**
 * Fetch all events from the EVENTS_STORE
 */
export const fetchAllEvents = async (): Promise<Event[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EVENTS_STORE, 'readonly')
    handleTxErrors(tx, db, reject)
    const store = tx.objectStore(EVENTS_STORE)
    const allEventsRequest = store.getAll()
    allEventsRequest.onsuccess = () => {
      resolve(allEventsRequest.result)
      db.close()
    }
    allEventsRequest.onerror = () => {
      reject(allEventsRequest.error)
      db.close()
    }
  })
}

/**
 * Fetch a single event by its ID
 */
export const fetchEventById = async (
  eventId: string,
): Promise<Event | null> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EVENTS_STORE, 'readonly')
    handleTxErrors(tx, db, reject)
    const store = tx.objectStore(EVENTS_STORE)
    const getRequest = store.get(eventId)
    getRequest.onsuccess = () => {
      resolve(getRequest.result || null)
      db.close()
    }
    getRequest.onerror = () => {
      reject(getRequest.error)
      db.close()
    }
  })
}

/**
 * Create a new event or update an existing one in the EVENTS_STORE
 * Returns the event key for confirmation
 */

export const saveEvent = async (event: Event): Promise<IDBValidKey> => {
  // Try to preserve createdAt if updating an existing event
  const eventToSave = { ...event }
  if (event.id) {
    const existing = await fetchEventById(event.id)
    if (existing && existing.createdAt) {
      eventToSave.createdAt = existing.createdAt
    }
  }
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EVENTS_STORE, 'readwrite')
    handleTxErrors(tx, db, reject)
    const store = tx.objectStore(EVENTS_STORE)
    const putRequest = store.put(eventToSave)
    putRequest.onsuccess = () => {
      resolve(putRequest.result)
      db.close()
    }
    putRequest.onerror = () => {
      reject(putRequest.error)
      db.close()
    }
  })
}

/**
 * Delete an event from the EVENTS_STORE by its ID
 */
export const deleteEventById = async (eventId: string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EVENTS_STORE, 'readwrite')
    handleTxErrors(tx, db, reject)
    const store = tx.objectStore(EVENTS_STORE)
    const deleteRequest = store.delete(eventId)
    deleteRequest.onsuccess = () => {
      resolve()
      db.close()
    }
    deleteRequest.onerror = () => {
      reject(deleteRequest.error)
      db.close()
    }
  })
}
