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

export type EventFormData = {
  id?: string
  title: string
  date: string
  time: string
  seconds: boolean
  minutes: boolean
  hours: boolean
  days: boolean
  months: boolean
  years: boolean
}
