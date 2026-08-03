import { Counter } from '@/components/Counter'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EventWithTags } from '@/types/event'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'

export const ListEvent = ({ event }: { event: EventWithTags }) => {
  const router = useRouter()
  const displayEventDatetime = dayjs(event.datetime).format('DD MMM YYYY HH:mm')
  const displayTags = event.tags.filter((tag) => !tag.system)

  const handleClick = () => {
    router.push(`/event/${event.id}`)
  }

  return (
    <Card className="cursor-pointer hover:bg-accent" onClick={handleClick}>
      <CardHeader>
        <CardTitle>{event.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Counter event={event} />
      </CardContent>
      <CardFooter>
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {displayEventDatetime}
          </span>
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
