import dayjs from 'dayjs'
import { EventFormData } from '@/types/event'

export const getEventDefaultValues = (): EventFormData => ({
  title: '',
  date: dayjs().format('YYYY-MM-DD'),
  time: dayjs().format('HH:mm'),
  endDate: '',
  endTime: '',
  tags: '',
  dateOnly: true,
  hasEnd: false,
  anniversaryProgressEnabled: false,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  endTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  seconds: false,
  minutes: false,
  hours: false,
  days: true,
  months: true,
  years: true,
})
