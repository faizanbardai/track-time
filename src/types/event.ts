export interface Event {
  id: string
  title: string
  datetime: string
  endDate?: string
  /** Legacy preference used as a fallback for single-date anniversaries. */
  progressEnabled?: boolean
  anniversaryProgressEnabled?: boolean
  dateOnly?: boolean
  timeZone?: string
  endTimeZone?: string
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

export interface TagOrder {
  id: 'custom'
  tagIds: string[]
}

export type TagWithUsage = Tag & {
  eventCount: number
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
  endDate: string
  endTime: string
  tags: string
  seconds: boolean
  minutes: boolean
  hours: boolean
  days: boolean
  months: boolean
  years: boolean
  dateOnly: boolean
  hasEnd: boolean
  anniversaryProgressEnabled: boolean
  timeZone: string
  endTimeZone: string
}
