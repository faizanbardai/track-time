import { Button } from '@/components/ui/button'
import { deleteEventById } from '@/helpers/indexedDB/index'
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
      await deleteEventById(eventId)
      router.push('/')
    } catch (err: any) {
      setError(err?.message || 'Failed to delete event')
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
      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </div>
  )
}

export default DeleteEvent
