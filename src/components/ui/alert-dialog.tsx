'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface AlertDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  destructive?: boolean
}

export const AlertDialog = ({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: AlertDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-lg border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClose={onCancel}
    >
      <div className="grid gap-4 p-6">
        <div className="grid gap-2">
          <h2 id="alert-dialog-title" className="text-lg font-semibold">
            {title}
          </h2>
          <p
            id="alert-dialog-description"
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
