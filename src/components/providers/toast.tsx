'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLoadingActions } from '@/components/providers/loading'

const DEFAULT_TOAST_DURATION = 5000

interface ToastAction {
  label: string
  onClick: () => void | Promise<void>
  keepLoading?: boolean
}

interface ToastData {
  message: string
  action?: ToastAction
  durationMs: number
}

interface ToastContextValue {
  showToast: (
    message: string,
    action?: ToastAction,
    durationMs?: number,
  ) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<ToastData | null>(null)
  const [actionPending, setActionPending] = useState(false)
  const { startLoading, stopLoading } = useLoadingActions()

  useEffect(() => {
    if (!toast?.action?.keepLoading && !actionPending) return
    startLoading()
    return stopLoading
  }, [actionPending, startLoading, stopLoading, toast?.action])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), toast.durationMs)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const showToast = (
    message: string,
    action?: ToastAction,
    durationMs = DEFAULT_TOAST_DURATION,
  ) =>
    setToast({
      message,
      action,
      durationMs,
    })

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 z-50 h-14 w-[calc(100%-1rem)] max-w-[1184px] -translate-x-1/2 overflow-hidden rounded-full border bg-background/95 p-1 text-sm shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <div
            role="status"
            className="flex h-full items-center justify-between gap-4 px-3"
          >
            <span>{toast.message}</span>
            {toast.action && (
              <Button
                type="button"
                variant="link"
                className="h-auto shrink-0 p-0"
                onClick={async () => {
                  const action = toast.action
                  if (!action) return
                  setActionPending(action.keepLoading === true)
                  setToast(null)
                  try {
                    await action.onClick()
                  } finally {
                    setActionPending(false)
                  }
                }}
              >
                {toast.action.label}
              </Button>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
