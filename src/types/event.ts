export interface Event {
  id: string
  title: string
  datetime: string
  createdAt: string
  updatedAt: string
}

export type EventFormData = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>
