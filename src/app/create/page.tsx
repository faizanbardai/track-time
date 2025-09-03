'use client'

import { useForm, Controller } from 'react-hook-form'
import dayjs from 'dayjs'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useCreate } from '@/app/create/useCreate'
import { EventFormData } from '@/types/event'

const CreatePage = () => {
  const { register, handleSubmit, control } = useForm<EventFormData>({
    defaultValues: {
      title: '',
      date: dayjs().format('YYYY-MM-DD'),
      time: dayjs().format('HH:mm'),
      seconds: true,
      minutes: true,
      hours: true,
      days: true,
      months: true,
      years: true,
    },
  })

  const { onSubmit } = useCreate()

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Create a new event</CardTitle>
          <CardDescription>
            Fill in the details below to create a new event
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
                <label className="flex items-center gap-2">
                  <Controller
                    name="seconds"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="seconds"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        name={field.name}
                        ref={field.ref}
                      />
                    )}
                  />
                  Seconds
                </label>
                <label className="flex items-center gap-2">
                  <Controller
                    name="minutes"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="minutes"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        name={field.name}
                        ref={field.ref}
                      />
                    )}
                  />
                  Minutes
                </label>
                <label className="flex items-center gap-2">
                  <Controller
                    name="hours"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="hours"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        name={field.name}
                        ref={field.ref}
                      />
                    )}
                  />
                  Hours
                </label>
                <label className="flex items-center gap-2">
                  <Controller
                    name="days"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="days"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        name={field.name}
                        ref={field.ref}
                      />
                    )}
                  />
                  Days
                </label>
                <label className="flex items-center gap-2">
                  <Controller
                    name="months"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="months"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        name={field.name}
                        ref={field.ref}
                      />
                    )}
                  />
                  Months
                </label>
                <label className="flex items-center gap-2">
                  <Controller
                    name="years"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="years"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        name={field.name}
                        ref={field.ref}
                      />
                    )}
                  />
                  Years
                </label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex justify-end">
          <Button type="submit">Create</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default CreatePage
