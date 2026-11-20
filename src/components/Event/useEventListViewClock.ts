import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import type { EventWithTags } from '@/types/event'
import { getNextEventViewTransition } from '@/helpers/eventViews'

export const useEventListViewClock = (
  events: EventWithTags[],
  {
    upcoming = false,
    anniversary = false,
  }: { upcoming?: boolean; anniversary?: boolean },
) => {
  const [transitionVersion, setTransitionVersion] = useState(0)
  const [now, setNow] = useState(() => dayjs())

  useEffect(() => {
    const current = dayjs().add(transitionVersion > 0 ? 1 : 0, 'millisecond')
    setNow(current)

    const nextTransition = getNextEventViewTransition(
      events,
      { upcoming, anniversary },
      current,
    )
    if (!nextTransition) return

    const delay = Math.min(
      Math.max(nextTransition.valueOf() - Date.now(), 0),
      2_147_483_647,
    )
    const timeout = setTimeout(() => {
      setTransitionVersion((version) => version + 1)
    }, delay)

    return () => clearTimeout(timeout)
  }, [anniversary, events, transitionVersion, upcoming])

  return now
}
