export type Event = {
  id: string
  title: string
  date: string
  time: string
  createdAt: string
  updatedAt: string
}

export type EventFormData = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>
