import { v4 as uuid } from 'uuid'
import { SubmitHandler } from 'react-hook-form'
import { Event, EventFormData } from '@/types/event'
import { saveEventToIndexedDB } from '@/helpers/indexedDB/saveEventToIndexedDB'
import { useRouter } from 'next/navigation'

export const useCreate = () => {
  const router = useRouter()

  const onSubmit: SubmitHandler<EventFormData> = async (data) => {
    const newEvent: Event = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }
    try {
      await saveEventToIndexedDB(newEvent)
      router.push('/')
    } catch (err) {
      // Optionally, show an error message
      console.error('Failed to save event:', err)
    }
  }

  return { onSubmit }
}
