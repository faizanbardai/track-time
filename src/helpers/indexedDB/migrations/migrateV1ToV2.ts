import { EVENTS_STORE } from '@/constants/indexedDB'
import dayjs from 'dayjs'

export const migrateV1ToV2 = (tx: IDBTransaction) => {
  const store = tx.objectStore(EVENTS_STORE)
  store.openCursor().onsuccess = (e) => {
    const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
    if (!cursor) return

    const value = cursor.value
    if (!value?.date) return

    const time = value.time || '00:00'
    value.datetime = dayjs(`${value.date}T${time}`).toISOString()
    delete value.date
    delete value.time
    cursor.update(value)
    cursor.continue()
  }
}
