import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { calculateTimeDiff } from '@/helpers/datetime/calculateTimeDiff'
import { Event } from '@/types/event'

export const Counter = ({ event }: { event: Event }) => {
  const [timeDiff, setTimeDiff] = useState(calculateTimeDiff(event))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeDiff(calculateTimeDiff(event))
    }, 1000)

    return () => clearInterval(interval)
  }, [event])

  const years = event.years ? <span>{timeDiff.years}Y </span> : null
  const months = event.months ? <span>{timeDiff.months}M </span> : null
  const days = event.days ? <span>{timeDiff.days}d </span> : null
  const hours = event.hours ? <span>{timeDiff.hours}h </span> : null
  const minutes = event.minutes ? <span>{timeDiff.minutes}m </span> : null
  const seconds = event.seconds ? <span>{timeDiff.seconds}s </span> : null

  return (
    <span>
      {years} {months} {days} {hours} {minutes} {seconds}
    </span>
  )
}
