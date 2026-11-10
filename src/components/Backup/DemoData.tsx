'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sparkles, Trash2 } from 'lucide-react'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  clearDemoData,
  getDemoEventCount,
  loadDemoData,
} from '@/helpers/indexedDB/demoData'

export const DemoData = () => {
  const { dbReady, dbError } = useIndexedDB()
  const [eventCount, setEventCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const refreshCount = useCallback(async () => {
    if (!dbReady) return
    setEventCount(await getDemoEventCount())
  }, [dbReady])

  useEffect(() => {
    void refreshCount().catch((reason: unknown) => {
      setError(
        reason instanceof Error ? reason.message : 'Unable to read demo data.',
      )
    })
  }, [refreshCount])

  const handleToggle = async () => {
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      if (eventCount > 0) {
        await clearDemoData()
        setEventCount(0)
        setStatus('Demo data removed. Your other events are unchanged.')
      } else {
        await loadDemoData()
        const count = await getDemoEventCount()
        setEventCount(count)
        setStatus(`${count} demo events added to this browser.`)
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to update demo data.',
      )
    } finally {
      setBusy(false)
    }
  }

  const unavailableMessage = dbError
    ? `Local storage is unavailable: ${dbError}`
    : 'Opening local storage…'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo data</CardTitle>
        <CardDescription>
          Add sample dates, intervals, anniversaries, and time zone examples for
          a quick walkthrough. The sample set is tracked by its IDs, so removing
          it leaves your own events and tags alone.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid justify-items-start gap-3">
        <Button
          type="button"
          variant={eventCount > 0 ? 'outline' : 'default'}
          onClick={() => void handleToggle()}
          disabled={!dbReady || busy}
        >
          {eventCount > 0 ? (
            <>
              <Trash2 aria-hidden="true" />
              {busy ? 'Removing demo data…' : 'Remove demo data'}
            </>
          ) : (
            <>
              <Sparkles aria-hidden="true" />
              {busy ? 'Loading demo data…' : 'Load demo data'}
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          {eventCount > 0
            ? `${eventCount} demo events are loaded in this browser.`
            : 'Demo records are stored locally and can be removed with this button.'}
        </p>
        {!dbReady && (
          <p className="text-sm text-destructive">{unavailableMessage}</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {status && (
          <p role="status" className="text-sm">
            {status}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
