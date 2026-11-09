import dayjs, { type Dayjs } from 'dayjs'
import {
  EMPTY_EVENT_COUNTER_UNITS,
  EMPTY_EVENT_EXAMPLES,
  EMPTY_EVENT_LIVE_COUNTER_UNITS,
  type EmptyEventExampleDefinition,
} from '@/constants/emptyEventExamples'
import type { EventWithTags } from '@/types/event'

const createExampleEvent = (
  example: EmptyEventExampleDefinition,
  datetime: string,
  options: {
    endDate?: string
    dateOnly?: boolean
    anniversaryProgressEnabled?: boolean
    counterUnits?: typeof EMPTY_EVENT_LIVE_COUNTER_UNITS
  } = {},
): EventWithTags => ({
  id: example.id,
  title: example.title,
  datetime,
  ...(options.endDate ? { endDate: options.endDate } : {}),
  dateOnly: options.dateOnly ?? true,
  ...(options.counterUnits ?? EMPTY_EVENT_COUNTER_UNITS),
  anniversaryProgressEnabled: options.anniversaryProgressEnabled ?? false,
  createdAt: '',
  updatedAt: '',
  tags: example.tagNames.map((name) => ({
    id: `example-tag-${name.toLowerCase().replaceAll(' ', '-')}`,
    name,
    system: false,
    createdAt: '',
    updatedAt: '',
  })),
})

const buildExampleEvent = (
  example: EmptyEventExampleDefinition,
  today: Dayjs,
): EventWithTags => {
  if (example.kind === 'past-date') {
    return createExampleEvent(
      example,
      today.subtract(example.daysAgo, 'days').format('YYYY-MM-DD'),
    )
  }

  if (example.kind === 'ongoing-interval') {
    const startDate = today
      .subtract(example.daysSinceStart, 'days')
      .startOf('day')
      .hour(example.startHour)
    const endDate = today
      .add(example.daysUntilEnd, 'days')
      .startOf('day')
      .hour(example.endHour)

    return createExampleEvent(
      example,
      startDate.toISOString(),
      {
        endDate: endDate.toISOString(),
        dateOnly: false,
        counterUnits: EMPTY_EVENT_LIVE_COUNTER_UNITS,
      },
    )
  }

  const endDate = today
    .subtract(example.yearsSinceEnd, 'years')
    .subtract(example.monthsSinceEnd, 'months')
  // Keep anniversary progress visibly underway. Date-only ranges include both
  // endpoints, so shift the start by one day to get an exact year duration.
  const startDate = endDate
    .subtract(example.durationYears, 'years')
    .add(1, 'day')

  return createExampleEvent(
    example,
    startDate.format('YYYY-MM-DD'),
    {
      endDate: endDate.format('YYYY-MM-DD'),
      anniversaryProgressEnabled: true,
    },
  )
}

export const getEmptyEventExamples = (today: string) => {
  const todayDate = dayjs(today)

  return EMPTY_EVENT_EXAMPLES.map((example) => ({
    label: example.label,
    event: buildExampleEvent(example, todayDate),
  }))
}
