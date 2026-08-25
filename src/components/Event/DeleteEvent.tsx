import { Button } from '@/components/ui/button'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { deleteEvent, restoreDeletedEvent } from '@/helpers/indexedDB/index'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/providers/toast'
import { useLoadingActions } from '@/components/providers/loading'

interface DeleteEventProps {
  eventId: string
  eventTitle: string
}

const DeleteEvent = ({ eventId, eventTitle }: DeleteEventProps) => {
  const router = useRouter()
  const { showToast } = useToast()
  const { startLoading, stopLoading } = useLoadingActions()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    startLoading()
    try {
      const snapshot = await deleteEvent(eventId)
      if (!snapshot) return
      router.push('/')
      showToast('Event deleted', {
        label: 'Undo',
        keepLoading: true,
        onClick: async () => {
          try {
            await restoreDeletedEvent(snapshot)
            showToast('Event restored')
          } catch {
            showToast('Unable to restore event')
          }
        },
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to delete event')
      }
    } finally {
      setLoading(false)
      setDialogOpen(false)
      stopLoading()
    }
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Delete event"
        title="Delete event"
        className="text-muted-foreground hover:text-destructive focus-visible:text-destructive"
        onClick={() => setDialogOpen(true)}
        disabled={loading}
      >
        <Trash2 aria-hidden="true" />
      </Button>
      {error && <span className="mt-1 text-xs text-destructive">{error}</span>}
      <AlertDialog
        open={dialogOpen}
        title={`Delete “${eventTitle}”?`}
        description="This event and its tag assignments will be removed. You can undo this for a few seconds after deletion."
        confirmLabel={loading ? 'Deleting...' : 'Delete event'}
        onConfirm={handleDelete}
        onCancel={() => !loading && setDialogOpen(false)}
        destructive
      />
    </div>
  )
}

export default DeleteEvent
