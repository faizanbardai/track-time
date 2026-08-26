export const timeUnits = [
  'seconds',
  'minutes',
  'hours',
  'days',
  'months',
  'years',
] as const

export type TimeUnit = (typeof timeUnits)[number]

export const units = [
  ...timeUnits.map((name) => ({
    name,
    label: name[0].toUpperCase() + name.slice(1),
  })),
]
