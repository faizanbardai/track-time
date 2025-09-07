import {
  DB_NAME,
  DB_VERSION,
  EVENTS_STORE,
  EVENT_ORDER_STORE,
} from '@/constants/indexedDB'
import { Event } from '@/types/event'

export const createStoreAndRunMigrations = (
  request: IDBOpenDBRequest,
  // event: IDBVersionChangeEvent,
) => {
  const db = request.result
  if (!db.objectStoreNames.contains(EVENTS_STORE)) {
    db.createObjectStore(EVENTS_STORE, { keyPath: 'id' })
  }
  if (!db.objectStoreNames.contains(EVENT_ORDER_STORE)) {
    db.createObjectStore(EVENT_ORDER_STORE, { keyPath: 'id' })
  }

  const tx = request.transaction
  if (!tx) return
}

/**
 * Utility to open the IndexedDB and return the db instance.
 * Handles errors and version upgrades.
 */
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      createStoreAndRunMigrations(request)
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
    allEventsRequest.onsuccess = async () => {
      const events: Event[] = allEventsRequest.result
      db.close()
      try {
        const order = await getEventOrder()
        // Sort events by order array, fallback to unsorted for missing ids
        const eventMap = new Map(events.map((e) => [e.id, e]))
        const sortedEvents = order
          .map((id) => eventMap.get(id))
          .filter(Boolean) as Event[]
        // Add any events not in order to the end
        const remaining = events.filter((e) => !order.includes(e.id))
        resolve([...sortedEvents, ...remaining])
      } catch (err: Error | unknown) {
        console.error('Error fetching event order:', err)
        resolve(events)
      }
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
  let existing: Event | null = null
  if (event.id) {
    existing = await fetchEventById(event.id)
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
    putRequest.onsuccess = async () => {
      resolve(putRequest.result)
      db.close()
      if (!existing) {
        await addEventToOrder(eventToSave.id)
      }
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
    deleteRequest.onsuccess = async () => {
      resolve()
      db.close()
      await removeEventFromOrder(eventId)
    }
    deleteRequest.onerror = () => {
      reject(deleteRequest.error)
      db.close()
    }
  })
}

/**
 * Fetch the event order array from EVENT_ORDER_STORE
 */
export const getEventOrder = async (): Promise<string[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EVENT_ORDER_STORE, 'readonly')
    handleTxErrors(tx, db, reject)
    const store = tx.objectStore(EVENT_ORDER_STORE)
    const getRequest = store.get('order')
    getRequest.onsuccess = () => {
      resolve(getRequest.result?.eventIds || [])
      db.close()
    }
    getRequest.onerror = () => {
      reject(getRequest.error)
      db.close()
    }
  })
}

/**
 * Set the event order array in EVENT_ORDER_STORE
 */
export const setEventOrder = async (eventIds: string[]): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EVENT_ORDER_STORE, 'readwrite')
    handleTxErrors(tx, db, reject)
    const store = tx.objectStore(EVENT_ORDER_STORE)
    const putRequest = store.put({ id: 'order', eventIds })
    putRequest.onsuccess = () => {
      resolve()
      db.close()
    }
    putRequest.onerror = () => {
      reject(putRequest.error)
      db.close()
    }
  })
}

/**
 * Add a new event ID to the event order array
 */
export const addEventToOrder = async (eventId: string): Promise<void> => {
  const currentOrder = await getEventOrder()
  currentOrder.push(eventId)
  await setEventOrder(currentOrder)
}

/**
 * Remove an event ID from the event order array
 */
export const removeEventFromOrder = async (eventId: string): Promise<void> => {
  const currentOrder = await getEventOrder()
  const newOrder = currentOrder.filter((id) => id !== eventId)
  await setEventOrder(newOrder)
}

/**
 * Update the event order array after a reorder
 */
export const updateEventOrder = async (eventIds: string[]): Promise<void> => {
  await setEventOrder(eventIds)
}
