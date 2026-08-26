import dayjs, { Dayjs, OpUnitType } from 'dayjs'
import { timeUnits } from '@/constants/units'
import type { Event } from '@/types/event'
import type { TimeUnit } from '@/constants/units'

type ProgressCycle = 'minute' | 'hour' | 'day' | 'month' | 'year'

const progressUnitLabels: Record<TimeUnit, string> = {
  seconds: 'seconds',
  minutes: 'minutes',
  hours: 'hours',
  days: 'days',
  months: 'months',
  years: 'years',
}

const progressCycles: Record<TimeUnit, ProgressCycle | undefined> = {
  seconds: 'minute',
  minutes: 'hour',
  hours: 'day',
  days: 'month',
  months: 'year',
  years: undefined,
}

const progressMeasurements: Record<TimeUnit, TimeUnit | undefined> = {
  seconds: undefined,
  minutes: 'seconds',
  hours: 'minutes',
  days: 'hours',
  months: 'days',
  years: 'months',
}

const progressUnits = [...timeUnits].reverse()

const getHighestSelectedUnit = (event: Event) =>
  progressUnits.find((unit) => event[unit])

const getProgressMeasurement = (event: Event) => {
  const selectedUnit = getHighestSelectedUnit(event)
  return selectedUnit ? progressMeasurements[selectedUnit] : undefined
}

const getYearCycle = (eventDate: Dayjs, now: Dayjs) => {
  let start = eventDate.year(now.year())

  if (start.isAfter(now)) start = start.subtract(1, 'year')

  return { start, end: start.add(1, 'year') }
}

const getCycleBounds = (event: Event, cycle: ProgressCycle, now: Dayjs) => {
  if (cycle === 'year') return getYearCycle(dayjs(event.datetime), now)

  const start = now.startOf(cycle as OpUnitType)
  return { start, end: start.add(1, cycle) }
}

export const calculateEventProgressDetails = (event: Event, now = dayjs()) => {
  if (!event.progressEnabled) return null

  const progressUnit = getProgressMeasurement(event)
  if (!progressUnit) return null

  const cycle = progressCycles[progressUnit]
  if (!cycle) return null

  const { start, end } = getCycleBounds(event, cycle, now)
  const cycleDuration = end.valueOf() - start.valueOf()
  const elapsed = now.valueOf() - start.valueOf()
  const progress = Math.min(1, Math.max(0, elapsed / cycleDuration))
  const elapsedUnits = Math.min(
    end.diff(start, progressUnit),
    Math.max(0, now.diff(start, progressUnit)),
  )

  return {
    progress,
    elapsedUnits,
    totalUnits: end.diff(start, progressUnit),
    unit: progressUnitLabels[progressUnit],
    description: `${elapsedUnits}/${end.diff(start, progressUnit)} ${progressUnitLabels[progressUnit]} · ${Math.round(progress * 100)}%`,
  }
}
