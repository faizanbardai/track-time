'use client'

import { DB_NAME, DB_VERSION, EVENTS_STORE } from '@/constants/indexedDB'
import { migrateV1ToV2 } from '@/helpers/indexedDB/migrations/migrateV1ToV2'
import { migrateV2ToV3 } from '@/helpers/indexedDB/migrations/migrateV2ToV3'
import React, { createContext, useContext, useEffect, useState } from 'react'

export type IndexedDBContextType = {
  dbReady: boolean
  dbError: string | null
}

const IndexedDBContext = createContext<IndexedDBContextType | undefined>(
  undefined,
)

export const IndexedDBProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let db: IDBDatabase | null = null
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      db = request.result
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

    request.onsuccess = () => {
      db = request.result
      setDbReady(true)
    }

    request.onerror = () => {
      setDbError(request.error?.message || 'IndexedDB error')
    }
  }, [])

  return (
    <IndexedDBContext.Provider value={{ dbReady, dbError }}>
      {children}
    </IndexedDBContext.Provider>
  )
}

export const useIndexedDB = () => {
  const ctx = useContext(IndexedDBContext)
  if (!ctx)
    throw new Error('useIndexedDB must be used within IndexedDBProvider')
  return ctx
}
