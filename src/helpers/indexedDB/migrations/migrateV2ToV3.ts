import { EVENTS_STORE } from '@/constants/indexedDB'

export const migrateV2ToV3 = (tx: IDBTransaction) => {
  const store = tx.objectStore(EVENTS_STORE)
  store.openCursor().onsuccess = (e) => {
    const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
    if (!cursor) return

    const value = cursor.value
    value.seconds = value.seconds ?? true
    value.minutes = value.minutes ?? true
    value.hours = value.hours ?? true
    value.days = value.days ?? true
    value.months = value.months ?? true
    value.years = value.years ?? true
    try {
      const updateRequest = cursor.update(value)
      updateRequest.onerror = (event) => {
        console.error('Error updating cursor value:', event)
      }
      updateRequest.onsuccess = () => {
        if (cursor) {
          cursor.continue()
        }
      }
    } catch (error) {
      console.error('Exception during cursor update:', error)
      cursor.continue()
    }
  }
}
