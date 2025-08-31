import { DB_NAME, DB_VERSION, EVENTS_STORE } from '@/constants/indexedDB'
import { Event } from '@/types/event'

export const fetchEventsFromIndexedDB = (): Promise<Event[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(EVENTS_STORE, 'readonly')
      const store = tx.objectStore(EVENTS_STORE)
      const allEventsRequest = store.getAll()
      allEventsRequest.onsuccess = () => resolve(allEventsRequest.result)
      allEventsRequest.onerror = () => reject(allEventsRequest.error)
    }
    request.onerror = () => reject(request.error)
  })
}
