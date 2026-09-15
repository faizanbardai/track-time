import { useEffect, useState } from 'react'
import { TimeZonePicker } from './TimeZonePicker'
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
import {
  isValidTimeZone,
  parseEventInput,
} from '@/helpers/datetime/eventTiming'
import { formatTagNames } from '@/helpers/indexedDB'
import { TagPicker } from '@/components/Tag/TagPicker'
import Link from 'next/link'
import { PATHS } from '@/constants/paths'
import { ArrowLeft } from 'lucide-react'

interface EventPageProps {
  event: EventWithTags | null
  defaultTags?: string
}

const getFormDefaultValues = (
  event: EventWithTags | null,
  defaultTags: string,
): EventFormData => {
  if (!event?.id) return { ...getEventDefaultValues(), tags: defaultTags }

  const { createdAt, updatedAt, datetime, endDate, tags, ...rest } = event
  return {
    ...rest,
    dateOnly: event.dateOnly ?? false,
    hasEnd: Boolean(endDate),
    anniversaryProgressEnabled:
      event.anniversaryProgressEnabled ??
      (!endDate && Boolean(event.progressEnabled)),
    timeZone:
      event.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    endTimeZone:
      event.endTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    date: (event.timeZone
      ? dayjs(datetime).tz(event.timeZone)
      : dayjs(datetime)
    ).format('YYYY-MM-DD'),
    time: (event.timeZone
      ? dayjs(datetime).tz(event.timeZone)
      : dayjs(datetime)
    ).format('HH:mm'),
    endDate: endDate
      ? (event.endTimeZone
          ? dayjs(endDate).tz(event.endTimeZone)
          : dayjs(endDate)
        ).format('YYYY-MM-DD')
      : '',
    endTime: endDate
      ? (event.endTimeZone
          ? dayjs(endDate).tz(event.endTimeZone)
          : dayjs(endDate)
        ).format('HH:mm')
      : '',
    tags: formatTagNames(tags),
  }
}

const CreateOrUpdateEvent = ({ event, defaultTags = '' }: EventPageProps) => {
  const { register, handleSubmit, control, watch, setValue, formState } =
    useForm<EventFormData>({
      defaultValues: getFormDefaultValues(event, defaultTags),
    })
  const startDate = watch('date')
  const dateOnly = watch('dateOnly')
  const hasEnd = watch('hasEnd')
  const timeZone = watch('timeZone')
  const startTime = watch('time')
  const endDate = watch('endDate')
  const endTime = watch('endTime')
  const [differentEndZone, setDifferentEndZone] = useState(() => {
    const defaults = getFormDefaultValues(event, defaultTags)
    return defaults.timeZone !== defaults.endTimeZone
  })
  useEffect(() => {
    if (!differentEndZone) setValue('endTimeZone', timeZone)
  }, [differentEndZone, timeZone, setValue])

  const { onSubmit, error } = useEvent()

  return (
    <div className="grid content-start gap-4 pb-20">
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
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  {...register('title')}
                  id="title"
                  placeholder="Title"
                  required
                />
              </div>
              <label className="flex items-center gap-2">
                <Controller
                  name="dateOnly"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={!field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(!checked)
                        if (checked) {
                          setValue('hours', true)
                          setValue('minutes', true)
                        }
                      }}
                    />
                  )}
                />
                Include time
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="date">{hasEnd ? 'Start date' : 'Date'}</Label>
                  <Input {...register('date')} id="date" type="date" required />
                </div>
                {!dateOnly && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="time">Start time</Label>
                      <Input
                        {...register('time')}
                        id="time"
                        type="time"
                        required
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="timeZone">Start timezone</Label>
                      <Controller
                        name="timeZone"
                        control={control}
                        render={({ field }) => (
                          <TimeZonePicker
                            id="timeZone"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            date={startDate}
                            time={startTime}
                          />
                        )}
                      />
                      {formState.errors.timeZone && (
                        <p role="alert" className="text-sm text-destructive">
                          {formState.errors.timeZone.message}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
              <label className="flex items-center gap-2">
                <Controller
                  name="hasEnd"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                Add end date
              </label>
              {hasEnd && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End date</Label>
                    <Input
                      {...register('endDate', {
                        validate: (value, values) => {
                          if (!values.hasEnd) return true
                          if (!value) return 'Enter an end date'
                          if (values.dateOnly)
                            return (
                              value >= values.date ||
                              'End date must be on or after start date'
                            )
                          if (
                            !isValidTimeZone(values.timeZone) ||
                            !isValidTimeZone(values.endTimeZone) ||
                            !values.endTime
                          )
                            return true
                          const start = parseEventInput(
                            values.date,
                            values.time,
                            values.timeZone,
                          )
                          const end = parseEventInput(
                            value,
                            values.endTime,
                            values.endTimeZone,
                          )
                          return end.isAfter(start) || 'End must be after start'
                        },
                      })}
                      id="endDate"
                      type="date"
                      min={dateOnly ? startDate : undefined}
                      required
                    />
                  </div>
                  {!dateOnly && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="endTime">End time</Label>
                        <Input
                          {...register('endTime')}
                          id="endTime"
                          type="time"
                          required
                        />
                      </div>
                      <label className="flex items-center gap-2 md:col-span-2">
                        <Checkbox
                          checked={differentEndZone}
                          onCheckedChange={(checked) =>
                            setDifferentEndZone(checked === true)
                          }
                        />
                        End uses a different timezone
                      </label>
                      {differentEndZone && (
                        <div className="grid gap-2 md:col-span-2">
                          <Label htmlFor="endTimeZone">End timezone</Label>
                          <Controller
                            name="endTimeZone"
                            control={control}
                            render={({ field }) => (
                              <TimeZonePicker
                                id="endTimeZone"
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                date={endDate || startDate}
                                time={endTime}
                              />
                            )}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {formState.errors.endDate && (
                    <p
                      role="alert"
                      className="col-span-full text-sm text-destructive"
                    >
                      {formState.errors.endDate.message}
                    </p>
                  )}
                  <p className="col-span-full text-sm text-muted-foreground">
                    {dateOnly
                      ? 'Both dates are included. Progress appears while the event is ongoing.'
                      : 'Progress follows the time between start and end.'}
                  </p>
                </div>
              )}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Controller
                    name="anniversaryProgressEnabled"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="anniversaryProgressEnabled"
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    )}
                  />
                  <Label htmlFor="anniversaryProgressEnabled">
                    Show progress to next anniversary
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {hasEnd
                    ? 'After completion, track each year from the end date. Ongoing events show start-to-end progress.'
                    : 'Track each year from this date, such as the time toward your next birthday.'}
                </p>
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
                  <Label>Display units</Label>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                    {units
                      .filter(
                        (unit) =>
                          !dateOnly ||
                          !['hours', 'minutes', 'seconds'].includes(unit.name),
                      )
                      .map((unit) => (
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
