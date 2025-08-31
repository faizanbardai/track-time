import { v4 as uuid } from 'uuid'
import { SubmitHandler } from 'react-hook-form'

export type Event = {
  id: string
  title: string
  date: string
  time: string
  createdAt: string
  updatedAt: string
}

export type EventFormData = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>

export const useCreate = () => {
  const onSubmit: SubmitHandler<EventFormData> = (data) => {
    const newEvent: Event = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }

    console.log(newEvent)
  }

  return { onSubmit }
}
