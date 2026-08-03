import { v4 as uuid } from 'uuid'
import { SubmitHandler } from 'react-hook-form'
import { EventFormData } from '@/types/event'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { EventDraft, parseTagNames, saveEvent } from '@/helpers/indexedDB'

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
      tags,
      seconds,
      minutes,
      hours,
      days,
      months,
      years,
    } = eventFormData
    const datetime = dayjs(`${date}T${time}`).toISOString()
    const newEventData: EventDraft = {
      id: id || uuid(),
      title,
      datetime,
      seconds,
      minutes,
      hours,
      days,
      months,
      years,
    }
    try {
      await saveEvent(newEventData, parseTagNames(tags))
      router.push('/')
    } catch (err) {
      console.error('Failed to create new event:', err)
    }
  }

  return { onSubmit }
}
