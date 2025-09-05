import { v4 as uuid } from 'uuid'
import { SubmitHandler } from 'react-hook-form'
import { Event, EventFormData } from '@/types/event'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { saveEvent } from '@/helpers/indexedDB'

export const useEvent = () => {
  const router = useRouter()
  const onSubmit: SubmitHandler<EventFormData> = async (
    eventFormData: EventFormData,
  ) => {
    const {
      id,
      date,
      time,
      title,
      seconds,
      minutes,
      hours,
      days,
      months,
      years,
    } = eventFormData
    const datetime = dayjs(`${date}T${time}`).toISOString()
    const newEventData: Event = {
      id: id || uuid(),
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
      await saveEvent(newEventData)
      router.push('/')
    } catch (err) {
      console.error('Failed to create new event:', err)
    }
  }

  return { onSubmit }
}
