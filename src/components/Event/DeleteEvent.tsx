import { Button } from '@/components/ui/button'
import { deleteEvent } from '@/helpers/indexedDB/index'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteEventProps {
  eventId: string
}

const DeleteEvent = ({ eventId }: DeleteEventProps) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      await deleteEvent(eventId)
      router.push('/')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to delete event')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        type="button"
        variant="destructive"
        onClick={handleDelete}
        disabled={loading}
        className="ml-2"
      >
        {loading ? 'Deleting...' : 'Delete Event'}
      </Button>
      {error && <span className="mt-1 text-xs text-destructive">{error}</span>}
    </div>
  )
}

export default DeleteEvent
