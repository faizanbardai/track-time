import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { SubmitHandler } from 'react-hook-form'
import { EventFormData } from '@/types/event'
import { useRouter } from 'next/navigation'
import { serializeEventDates } from '@/helpers/datetime/eventTiming'
import { EventDraft, parseTagNames, saveEvent } from '@/helpers/indexedDB'
import { useLoadingActions } from '@/components/providers/loading'
import { navigateWithOfflineFallback } from '@/lib/offlineNavigation'
import { MAX_EVENT_TITLE_LENGTH } from '@/constants/validation'

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
    if (title.trim().length > MAX_EVENT_TITLE_LENGTH) {
      setError(`Title cannot exceed ${MAX_EVENT_TITLE_LENGTH} characters`)
      return
    }
    try {
      startLoading()
      const newEventData: EventDraft = {
        id: id || uuid(),
        title: title.trim(),
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
      // Replace the edit history entry so Back won't reopen the saved form.
      navigateWithOfflineFallback('/', () => {
        if (id) {
          router.replace('/')
        } else {
          router.push('/')
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      stopLoading()
    }
  }

  return { onSubmit, error }
}
