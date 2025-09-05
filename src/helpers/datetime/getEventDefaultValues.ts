import dayjs from 'dayjs'
import { EventFormData } from '@/types/event'

export const getEventDefaultValues = (): EventFormData => ({
  title: '',
  date: dayjs().format('YYYY-MM-DD'),
  time: dayjs().format('HH:mm'),
  seconds: true,
  minutes: true,
  hours: true,
  days: true,
  months: true,
  years: true,
})
