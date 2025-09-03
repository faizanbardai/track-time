import { v4 as uuid } from 'uuid'
import { SubmitHandler } from 'react-hook-form'
import { Event, EventFormData } from '@/types/event'
import { saveEventToIndexedDB } from '@/helpers/indexedDB/saveEventToIndexedDB'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'

export const useCreate = () => {
  const router = useRouter()

  const onSubmit: SubmitHandler<EventFormData> = async ({
    date,
    time,
    title,
    seconds,
    minutes,
    hours,
    days,
    months,
    years,
  }) => {
    const datetime = dayjs(`${date}T${time}`).toISOString()
    const newEvent: Event = {
      id: uuid(),
      title,
      datetime,
      seconds,
      minutes,
      hours,
      days,
      months,
      years,
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
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
