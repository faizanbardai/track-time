'use client'

import { DB_NAME, DB_VERSION, EVENTS_STORE } from '@/constants/indexedDB'
import { migrateV1ToV2 } from '@/helpers/indexedDB/migrations/migrateV1ToV2'
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
      // Migration: v1 -> v2
      else if (event.oldVersion < 2) {
        const tx = request.transaction
        if (!tx) return
        migrateV1ToV2(tx, EVENTS_STORE)
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
