import { useForm, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DeleteEvent from '@/components/Event/DeleteEvent'
import { Checkbox } from '@/components/ui/checkbox'
import { useEvent } from '@/app/event/useEvent'
import { Event, EventFormData } from '@/types/event'
import { units } from '@/constants/units'
import { getEventDefaultValues } from '@/helpers/datetime/getEventDefaultValues'
import dayjs from 'dayjs'

interface EventPageProps {
  event: Event | null
}

const getFormDefaultValues = (event: Event | null): EventFormData => {
  if (!event?.id) return getEventDefaultValues()

  const { createdAt, updatedAt, datetime, ...rest } = event
  return {
    ...rest,
    date: dayjs(datetime).format('YYYY-MM-DD'),
    time: dayjs(datetime).format('HH:mm'),
  }
}

const CreateOrUpdateEvent = ({ event }: EventPageProps) => {
  const { register, handleSubmit, control } = useForm<EventFormData>({
    defaultValues: getFormDefaultValues(event),
  })

  const { onSubmit } = useEvent()

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>
            {event?.id ? 'Edit Event' : 'Create a new event'}
          </CardTitle>
          <CardDescription>
            Fill in the details below to create or update an event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                {...register('title')}
                id="title"
                placeholder="Title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input {...register('date')} id="date" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <Input {...register('time')} id="time" type="time" />
            </div>
            <div className="grid gap-2">
              <Label>Enable units</Label>
              <div className="flex flex-wrap gap-4">
                {units.map((unit) => (
                  <label
                    key={unit.name}
                    htmlFor={unit.name}
                    className="flex items-center gap-2"
                  >
                    <Controller
                      name={unit.name as keyof EventFormData}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id={unit.name}
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                          name={field.name}
                          ref={field.ref}
                        />
                      )}
                    />
                    {unit.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex justify-end gap-2">
          <Button type="submit">
            {event?.id ? 'Update Event' : 'Create Event'}
          </Button>
          {event?.id && <DeleteEvent eventId={event.id} />}
        </CardFooter>
      </form>
    </Card>
  )
}

export default CreateOrUpdateEvent
