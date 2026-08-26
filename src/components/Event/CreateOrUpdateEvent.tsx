import { useForm, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DeleteEvent from '@/components/Event/DeleteEvent'
import { Checkbox } from '@/components/ui/checkbox'
import { useEvent } from '@/app/event/useEvent'
import { EventFormData, EventWithTags } from '@/types/event'
import { units } from '@/constants/units'
import { getEventDefaultValues } from '@/helpers/datetime/getEventDefaultValues'
import dayjs from 'dayjs'
import { formatTagNames } from '@/helpers/indexedDB'
import { TagPicker } from '@/components/Tag/TagPicker'
import Link from 'next/link'
import { PATHS } from '@/constants/paths'
import { ArrowLeft } from 'lucide-react'

interface EventPageProps {
  event: EventWithTags | null
}

const getFormDefaultValues = (event: EventWithTags | null): EventFormData => {
  if (!event?.id) return getEventDefaultValues()

  const { createdAt, updatedAt, datetime, endDate, tags, ...rest } = event
  return {
    ...rest,
    progressEnabled: event.progressEnabled ?? false,
    date: dayjs(datetime).format('YYYY-MM-DD'),
    time: dayjs(datetime).format('HH:mm'),
    endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : '',
    endTime: endDate ? dayjs(endDate).format('HH:mm') : '',
    tags: formatTagNames(tags),
  }
}

const CreateOrUpdateEvent = ({ event }: EventPageProps) => {
  const { register, handleSubmit, control, watch, formState } =
    useForm<EventFormData>({
      defaultValues: getFormDefaultValues(event),
    })
  const startDate = watch('date')
  const startTime = watch('time')
  const endDate = watch('endDate')

  const { onSubmit } = useEvent()

  return (
    <div className="grid gap-4 pb-20">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline">
          <Link href={PATHS.HOME}>
            <ArrowLeft aria-hidden="true" />
            Back to events
          </Link>
        </Button>
        {event?.id && (
          <DeleteEvent eventId={event.id} eventTitle={event.title} />
        )}
      </div>
      <Card className="gap-4 py-4">
        <form id="event-form" onSubmit={handleSubmit(onSubmit)}>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  {...register('title')}
                  id="title"
                  placeholder="Title"
                  required
                />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input {...register('date')} id="date" type="date" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input {...register('time')} id="time" type="time" />
                </div>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End date</Label>
                  <Input
                    {...register('endDate', {
                      validate: (value) =>
                        !value ||
                        value >= startDate ||
                        'End date must be after start date',
                    })}
                    id="endDate"
                    type="date"
                    min={startDate}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">Time</Label>
                  <Input
                    {...register('endTime', {
                      validate: (value) =>
                        !endDate ||
                        endDate !== startDate ||
                        value >= (startTime || '00:00') ||
                        'End time must be after start time',
                    })}
                    id="endTime"
                    type="time"
                    disabled={!endDate}
                  />
                </div>
                {formState.errors.endDate && (
                  <p className="col-span-full text-sm text-destructive">
                    {formState.errors.endDate.message}
                  </p>
                )}
                {formState.errors.endTime && (
                  <p className="col-span-full text-sm text-destructive">
                    {formState.errors.endTime.message}
                  </p>
                )}
              </div>
              <div className="grid items-start gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Tags</Label>
                    <Button
                      asChild
                      type="button"
                      variant="link"
                      className="h-auto p-0"
                    >
                      <Link href={PATHS.TAGS}>Manage tags</Link>
                    </Button>
                  </div>
                  <Controller
                    name="tags"
                    control={control}
                    render={({ field }) => (
                      <TagPicker
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Enable units</Label>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-2">
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
                  <label
                    htmlFor="progressEnabled"
                    className="mt-2 flex items-center gap-2"
                  >
                    <Controller
                      name="progressEnabled"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="progressEnabled"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          name={field.name}
                          ref={field.ref}
                        />
                      )}
                    />
                    Show progress
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </form>
      </Card>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-[1200px] justify-end gap-2 px-2 py-3">
          <Button type="submit" form="event-form">
            {event?.id ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateOrUpdateEvent
