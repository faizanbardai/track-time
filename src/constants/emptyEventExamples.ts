export type EmptyEventExampleDefinition = {
  id: string
  label: string
  title: string
  tagNames: readonly string[]
} & (
  | { kind: 'past-date'; daysAgo: number }
  | {
      kind: 'ongoing-interval'
      daysSinceStart: number
      daysUntilEnd: number
      startHour: number
      endHour: number
    }
  | {
      kind: 'completed-interval'
      yearsSinceEnd: number
      monthsSinceEnd: number
      durationYears: number
    }
)

export const EMPTY_EVENT_EXAMPLES = [
  {
    id: 'example-past-date',
    kind: 'past-date',
    label: 'A date in the past',
    title: 'Moved into my first home',
    tagNames: ['Home', 'Milestone'],
    daysAgo: 180,
  },
  {
    id: 'example-ongoing-interval',
    kind: 'ongoing-interval',
    label: 'An interval in progress',
    title: 'Summer road trip',
    tagNames: ['Travel'],
    daysSinceStart: 2,
    daysUntilEnd: 3,
    startHour: 8,
    endHour: 17,
  },
  {
    id: 'example-completed-interval',
    kind: 'completed-interval',
    label: 'A completed interval with anniversary progress',
    title: "Bachelor's degree",
    tagNames: ['Education'],
    yearsSinceEnd: 5,
    monthsSinceEnd: 6,
    durationYears: 3,
  },
] as const satisfies readonly EmptyEventExampleDefinition[]

export const EMPTY_EVENT_COUNTER_UNITS = {
  seconds: false,
  minutes: false,
  hours: false,
  days: true,
  months: true,
  years: true,
} as const

type ExampleCounterUnits = {
  [Unit in keyof typeof EMPTY_EVENT_COUNTER_UNITS]: boolean
}

export const EMPTY_EVENT_LIVE_COUNTER_UNITS: ExampleCounterUnits = {
  seconds: true,
  minutes: true,
  hours: true,
  days: true,
  months: false,
  years: false,
}
