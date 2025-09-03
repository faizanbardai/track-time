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

export const ListEvent = ({ event }: { event: Event }) => {
  const displayEventDatetime = dayjs(event.datetime).format('DD MMM YYYY HH:mm')

  return (
    <Card className="">
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
