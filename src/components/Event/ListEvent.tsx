import { Counter } from '@/components/Counter'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Event } from '@/types/event'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'

export const ListEvent = ({ event }: { event: Event }) => {
  const router = useRouter()
  const displayEventDatetime = dayjs(event.datetime).format('DD MMM YYYY HH:mm')

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
        <span className="text-sm text-muted-foreground">
          {displayEventDatetime}
        </span>
      </CardFooter>
    </Card>
  )
}
