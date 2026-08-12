import { Counter } from '@/components/Counter'
import { Card, CardTitle } from '@/components/ui/card'
import { EventWithTags } from '@/types/event'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface ListEventProps {
  event: EventWithTags
  dragHandle?: ReactNode
}

export const ListEvent = ({ event, dragHandle }: ListEventProps) => {
  const router = useRouter()
  const displayEventDatetime = dayjs(event.datetime).format('DD MMM YYYY HH:mm')
  const displayTags = event.tags.filter((tag) => !tag.system)

  const handleClick = () => {
    router.push(`/event/${event.id}`)
  }

  return (
    <Card
      className="cursor-pointer gap-0 py-0 transition-colors hover:bg-accent"
      onClick={handleClick}
    >
      <div className="flex items-center gap-1 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{event.title}</CardTitle>
          <div className="mt-1 text-sm">
            <Counter event={event} />
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="text-xs text-muted-foreground">
              {displayEventDatetime}
            </span>
            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {displayTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {dragHandle}
      </div>
    </Card>
  )
}
