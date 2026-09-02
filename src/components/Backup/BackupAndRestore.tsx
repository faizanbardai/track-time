'use client'

import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  backupFileName,
  createBackup,
  decryptBackup,
  encryptBackup,
  restoreBackup,
  summarizeBackup,
} from '@/helpers/indexedDB/backup'
import type { BackupSummary, BackupV1 } from '@/types/backup'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/providers/toast'
import { useLoadingActions } from '@/components/providers/loading'
import { BottomPillSelector } from '@/components/ui/BottomPill'
import { useSwipeNavigation } from '@/components/ui/useSwipeNavigation'
import { Download, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_BACKUP_FILE_BYTES = 50 * 1024 * 1024
const BACKUP_MODES = ['backup', 'restore'] as const

type BackupMode = (typeof BACKUP_MODES)[number]

const getMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

const downloadJson = (contents: unknown, fileName: string) => {
  const blob = new Blob([JSON.stringify(contents, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const BackupAndRestore = () => {
  const { dbReady, dbError } = useIndexedDB()
  const { showToast } = useToast()
  const { startLoading, stopLoading } = useLoadingActions()
  const [exportPassword, setExportPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContents, setFileContents] = useState<string | null>(null)
  const [importPassword, setImportPassword] = useState('')
  const [backup, setBackup] = useState<BackupV1 | null>(null)
  const [summary, setSummary] = useState<BackupSummary | null>(null)
  const [importing, setImporting] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<BackupMode>('backup')
  const [displayedMode, setDisplayedMode] = useState<BackupMode>('backup')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileReadId = useRef(0)
  const {
    bind: swipeNavigation,
    cancel: cancelSwipeNavigation,
    isSettling,
    trackRef,
  } = useSwipeNavigation({
    activeKey: activeMode,
    keys: BACKUP_MODES,
    onSelect: setActiveMode,
    onSwipeCommit: setDisplayedMode,
  })

  const selectMode = (mode: BackupMode) => {
    cancelSwipeNavigation()
    setDisplayedMode(mode)
    setActiveMode(mode)
  }

  const handleExport = async (event: FormEvent) => {
    event.preventDefault()
    setExportError(null)
    setExportMessage(null)

    if (exportPassword.length < 8) {
      setExportError('Choose a password with at least 8 characters.')
      return
    }
    if (exportPassword !== confirmPassword) {
      setExportError('The passwords do not match.')
      return
    }

    setExporting(true)
    startLoading()
    try {
      const currentBackup = await createBackup()
      const encrypted = await encryptBackup(currentBackup, exportPassword)
      downloadJson(encrypted, backupFileName(currentBackup.exportedAt))
      setExportPassword('')
      setConfirmPassword('')
      setExportMessage(
        'Encrypted backup downloaded. Keep both the file and password safe.',
      )
    } catch (error) {
      setExportError(getMessage(error, 'Unable to create the backup.'))
    } finally {
      setExporting(false)
      stopLoading()
    }
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = event.target.files?.[0] ?? null
    const readId = ++fileReadId.current
    setSelectedFile(file)
    setFileContents(null)
    setImportPassword('')
    setBackup(null)
    setSummary(null)
    setImportError(null)
    setImportMessage(null)
    if (!file) return

    if (file.size > MAX_BACKUP_FILE_BYTES) {
      setSelectedFile(null)
      input.value = ''
      setImportError('The selected backup is larger than the 50 MB limit.')
      return
    }

    try {
      startLoading()
      const contents = await file.text()
      if (readId !== fileReadId.current) return
      setFileContents(contents)
    } catch (error) {
      if (readId !== fileReadId.current) return
      setImportError(getMessage(error, 'Unable to read the selected file.'))
    } finally {
      stopLoading()
    }
  }

  const handleUnlock = async (event: FormEvent) => {
    event.preventDefault()
    if (!fileContents) return
    setImporting(true)
    startLoading()
    setImportError(null)
    setImportMessage(null)
    setBackup(null)
    setSummary(null)
    try {
      const unlocked = await decryptBackup(fileContents, importPassword)
      setBackup(unlocked)
      setSummary(summarizeBackup(unlocked))
      setImportPassword('')
    } catch (error) {
      setImportError(getMessage(error, 'Unable to unlock the backup.'))
    } finally {
      setImporting(false)
      stopLoading()
    }
  }

  const handleRestore = async () => {
    if (!backup || !summary) return

    setImporting(true)
    startLoading()
    setImportError(null)
    setImportMessage(null)
    try {
      await restoreBackup(backup)
      setImportMessage(
        `Restore complete: ${summary.eventCount} events and ${summary.customTagCount} custom tags imported.`,
      )
      setBackup(null)
      setSummary(null)
      setSelectedFile(null)
      setFileContents(null)
      showToast('Backup restored successfully')
      fileReadId.current += 1
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setImportError(
        `${getMessage(error, 'Unable to restore the backup.')} Your existing data was not changed.`,
      )
    } finally {
      setImporting(false)
      setRestoreDialogOpen(false)
      stopLoading()
    }
  }

  const unavailableMessage = dbError
    ? `Local storage is unavailable: ${dbError}`
    : 'Opening local storage…'

  return (
    <>
      <div
        data-testid="backup-swipe-surface"
        className={cn(
          'h-full min-h-[calc(100dvh-4.5rem)] touch-pan-y overflow-x-clip',
          isSettling && 'pointer-events-none',
        )}
        {...swipeNavigation}
      >
        <div
          ref={trackRef}
          className="relative will-change-transform"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          <Card
            id="data-backup-panel"
            role="tabpanel"
            aria-labelledby="data-backup-tab"
            aria-hidden={activeMode !== 'backup'}
            inert={activeMode !== 'backup'}
            className={cn(
              'w-full',
              activeMode === 'backup'
                ? 'relative'
                : 'pointer-events-none absolute top-0 right-[calc(100%+0.75rem)]',
            )}
          >
            <CardHeader>
              <CardTitle>Download a backup</CardTitle>
              <CardDescription>
                Export all events, tags, assignments, and ordering to an
                encrypted JSON file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExport} className="grid gap-4">
                <p className="text-sm text-muted-foreground">
                  The password cannot be recovered. You will need it to restore
                  this backup on any browser or device.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="export-password">Backup password</Label>
                  <Input
                    id="export-password"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={exportPassword}
                    onChange={(event) => setExportPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>
                {!dbReady && (
                  <p className="text-sm text-destructive">
                    {unavailableMessage}
                  </p>
                )}
                {exportError && (
                  <p role="alert" className="text-sm text-destructive">
                    {exportError}
                  </p>
                )}
                {exportMessage && (
                  <p role="status" className="text-sm">
                    {exportMessage}
                  </p>
                )}
                <Button type="submit" disabled={!dbReady || exporting}>
                  {exporting ? 'Encrypting…' : 'Download encrypted backup'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card
            id="data-restore-panel"
            role="tabpanel"
            aria-labelledby="data-restore-tab"
            aria-hidden={activeMode !== 'restore'}
            inert={activeMode !== 'restore'}
            className={cn(
              'w-full',
              activeMode === 'restore'
                ? 'relative'
                : 'pointer-events-none absolute top-0 left-[calc(100%+0.75rem)]',
            )}
          >
            <CardHeader>
              <CardTitle>Restore a backup</CardTitle>
              <CardDescription>
                Unlock and inspect a backup before replacing the data on this
                device.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="backup-file">Encrypted backup file</Label>
                <Input
                  ref={fileInputRef}
                  id="backup-file"
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => void handleFile(event)}
                  disabled={!dbReady || importing}
                />
              </div>

              {selectedFile && !backup && (
                <form onSubmit={handleUnlock} className="grid gap-4">
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="import-password">Backup password</Label>
                    <Input
                      id="import-password"
                      type="password"
                      autoComplete="current-password"
                      value={importPassword}
                      onChange={(event) =>
                        setImportPassword(event.target.value)
                      }
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={!fileContents || !importPassword || importing}
                  >
                    {importing ? 'Unlocking…' : 'Unlock and preview'}
                  </Button>
                </form>
              )}

              {summary && backup && (
                <div className="grid gap-4 rounded-md border p-4">
                  <div>
                    <h3 className="font-medium">Backup summary</h3>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-muted-foreground">Exported</dt>
                      <dd>{new Date(summary.exportedAt).toLocaleString()}</dd>
                      <dt className="text-muted-foreground">Events</dt>
                      <dd>{summary.eventCount}</dd>
                      <dt className="text-muted-foreground">Custom tags</dt>
                      <dd>{summary.customTagCount}</dd>
                      <dt className="text-muted-foreground">Assignments</dt>
                      <dd>{summary.assignmentCount}</dd>
                    </dl>
                  </div>
                  <p className="text-sm font-medium text-destructive">
                    Restoring replaces all current events, tags, assignments,
                    and ordering on this device.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setRestoreDialogOpen(true)}
                    disabled={importing}
                  >
                    {importing ? 'Restoring…' : 'Replace data and restore'}
                  </Button>
                </div>
              )}

              {!dbReady && (
                <p className="text-sm text-destructive">{unavailableMessage}</p>
              )}
              {importError && (
                <p role="alert" className="text-sm text-destructive">
                  {importError}
                </p>
              )}
              {importMessage && (
                <p role="status" className="text-sm">
                  {importMessage}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomPillSelector
        ariaLabel="Backup and restore"
        idBase="data"
        value={displayedMode}
        options={[
          {
            value: 'backup',
            label: 'Backup',
            icon: <Download aria-hidden="true" className="size-4" />,
          },
          {
            value: 'restore',
            label: 'Restore',
            icon: <Upload aria-hidden="true" className="size-4" />,
          },
        ]}
        onValueChange={selectMode}
      />

      {summary && (
        <AlertDialog
          open={restoreDialogOpen}
          title="Replace local data?"
          description={`Restore ${summary.eventCount} events and replace all current local data? This cannot be undone.`}
          confirmLabel={importing ? 'Restoring…' : 'Replace and restore'}
          onConfirm={handleRestore}
          onCancel={() => !importing && setRestoreDialogOpen(false)}
          destructive
        />
      )}
    </>
  )
}
