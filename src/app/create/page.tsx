'use client'

import { useForm } from 'react-hook-form'
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
import { EventFormData, useCreate } from '@/app/create/useCreate'

const CreatePage = () => {
  const { register, handleSubmit } = useForm<EventFormData>()

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
