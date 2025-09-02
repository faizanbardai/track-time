import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { calculateTimeDiff } from '@/helpers/datetime/calculateTimeDiff'

export const Counter = ({ eventDatetime }: { eventDatetime: string }) => {
  const [timeDiff, setTimeDiff] = useState(calculateTimeDiff(eventDatetime))

  const displayEventDatetime = dayjs(eventDatetime).format(
    'YYYY-MM-DD HH:mm:ss',
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeDiff(calculateTimeDiff(eventDatetime))
    }, 1000)

    return () => clearInterval(interval)
  }, [eventDatetime])

  return (
    <div className="flex flex-col items-start gap-1 text-sm">
      <div>
        Event Date & Time:{' '}
        <span className="font-mono">{displayEventDatetime}</span>
      </div>
      <span className="inline-block rounded bg-accent font-mono">
        {timeDiff.years}Y {timeDiff.months}M {timeDiff.days}d {timeDiff.hours}h{' '}
        {timeDiff.minutes}m {timeDiff.seconds}s
      </span>
    </div>
  )
}
