'use client'

import { openDB } from '@/helpers/indexedDB'
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

    openDB()
      .then(() => setDbReady(true))
      .catch((err: unknown) => {
        if (err && typeof err === 'object' && 'message' in err) {
          setDbError((err as { message?: string }).message || 'IndexedDB error')
        } else {
          setDbError('IndexedDB error')
        }
      })
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
