export interface Event {
  id: string
  title: string
  datetime: string
  seconds: boolean
  minutes: boolean
  hours: boolean
  days: boolean
  months: boolean
  years: boolean
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  system: boolean
  createdAt: string
  updatedAt: string
}

export interface TagEventOrder {
  id: string
  tagId: string
  eventId: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type EventWithTags = Event & {
  tags: Tag[]
}

export type EventFormData = {
  id?: string
  title: string
  date: string
  time: string
  tags: string
  seconds: boolean
  minutes: boolean
  hours: boolean
  days: boolean
  months: boolean
  years: boolean
}
