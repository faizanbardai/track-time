import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { SubmitHandler } from 'react-hook-form'
import { EventFormData } from '@/types/event'
import { useRouter } from 'next/navigation'
import { serializeEventDates } from '@/helpers/datetime/eventTiming'
import { EventDraft, parseTagNames, saveEvent } from '@/helpers/indexedDB'
import { useLoadingActions } from '@/components/providers/loading'

export const useEvent = () => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { startLoading, stopLoading } = useLoadingActions()
  const onSubmit: SubmitHandler<EventFormData> = async (
    eventFormData: EventFormData,
  ) => {
    const { id, title, tags, seconds, minutes, hours, days, months, years } =
      eventFormData
    setError(null)
    try {
      startLoading()
      const newEventData: EventDraft = {
        id: id || uuid(),
        title,
        anniversaryProgressEnabled: eventFormData.anniversaryProgressEnabled,
        ...serializeEventDates(eventFormData),
        seconds,
        minutes,
        hours,
        days,
        months,
        years,
      }
      await saveEvent(newEventData, parseTagNames(tags))
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      stopLoading()
    }
  }

  return { onSubmit, error }
}
