'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { Loader } from '@/components/ui/loader'

interface LoadingActions {
  startLoading: () => void
  stopLoading: () => void
}

const LoadingStateContext = createContext<boolean | undefined>(undefined)
const LoadingActionsContext = createContext<LoadingActions | undefined>(
  undefined,
)

export const LoadingProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [loadingCount, setLoadingCount] = useState(0)
  const startLoading = useCallback(() => {
    setLoadingCount((count) => count + 1)
  }, [])
  const stopLoading = useCallback(() => {
    setLoadingCount((count) => Math.max(0, count - 1))
  }, [])
  const actions = useMemo(
    () => ({
      startLoading,
      stopLoading,
    }),
    [startLoading, stopLoading],
  )

  return (
    <LoadingActionsContext.Provider value={actions}>
      <LoadingStateContext.Provider value={loadingCount > 0}>
        {children}
      </LoadingStateContext.Provider>
    </LoadingActionsContext.Provider>
  )
}

export const GlobalLoader = () => {
  const isLoading = useLoadingState()

  return (
    <div className="h-0.5" aria-busy={isLoading}>
      {isLoading && <Loader />}
      <span className="sr-only" role="status" aria-live="polite">
        {isLoading ? 'Loading...' : ''}
      </span>
    </div>
  )
}

export const useLoadingActions = () => {
  const context = useContext(LoadingActionsContext)
  if (!context)
    throw new Error('useLoadingActions must be used within LoadingProvider')
  return context
}

export const useLoadingState = () => {
  const context = useContext(LoadingStateContext)
  if (context === undefined)
    throw new Error('useLoadingState must be used within LoadingProvider')
  return context
}
