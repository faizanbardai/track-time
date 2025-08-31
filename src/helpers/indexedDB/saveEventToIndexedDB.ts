import { DB_NAME, DB_VERSION, EVENTS_STORE } from '@/constants/indexedDB'
import { Event } from '@/types/event'

export const saveEventToIndexedDB = (event: Event): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(EVENTS_STORE, 'readwrite')
      const store = tx.objectStore(EVENTS_STORE)
      store.put(event)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    }
    request.onerror = () => reject(request.error)
  })
}
