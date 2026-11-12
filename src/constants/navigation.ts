import { PATHS } from './paths'

export const NAVIGATION_LABELS = {
  events: 'Events',
  tags: 'Manage tags',
  data: 'Backup & restore',
  newEvent: 'New event',
  editEvent: 'Edit event',
  upcoming: 'Upcoming',
} as const

export const getPageTitle = (pathname: string) => {
  if (pathname === PATHS.TAGS) return NAVIGATION_LABELS.tags
  if (pathname === PATHS.DATA) return NAVIGATION_LABELS.data
  if (pathname === PATHS.EVENT) return NAVIGATION_LABELS.newEvent
  if (pathname.startsWith(`${PATHS.EVENT}/`)) return NAVIGATION_LABELS.editEvent
  return NAVIGATION_LABELS.events
}
