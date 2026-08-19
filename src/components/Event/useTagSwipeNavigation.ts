import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { type SwipeEventData, useSwipeable } from 'react-swipeable'
import type { Tag } from '@/types/event'

const MIN_SWIPE_DISTANCE = 56
const HORIZONTAL_INTENT_RATIO = 1.25
const MAX_SWIPE_DURATION = 700
const CLICK_SUPPRESSION_DURATION = 500
const INTERACTIVE_TARGET_SELECTOR =
  'a, button, input, select, textarea, [role="button"], [data-swipe-navigation-ignore]'

type SwipeDirection = 'next' | 'previous'

export const hasHorizontalSwipeIntent = (absX: number, absY: number) =>
  absX >= absY * HORIZONTAL_INTENT_RATIO

export const getAdjacentTagId = (
  tags: Array<Pick<Tag, 'id'>>,
  activeTagId: string,
  direction: SwipeDirection,
) => {
  const activeIndex = tags.findIndex(({ id }) => id === activeTagId)
  if (activeIndex === -1) return null

  const nextIndex = activeIndex + (direction === 'next' ? 1 : -1)
  return tags[nextIndex]?.id ?? null
}

export const useTagSwipeNavigation = ({
  activeTagId,
  tags,
  onSelectTag,
}: {
  activeTagId: string
  tags: Tag[]
  onSelectTag: (tagId: string) => void
}) => {
  const suppressClickRef = useRef(false)
  const clickSuppressionTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const clearClickSuppressionTimer = useCallback(() => {
    if (clickSuppressionTimerRef.current !== null) {
      clearTimeout(clickSuppressionTimerRef.current)
      clickSuppressionTimerRef.current = null
    }
  }, [])

  useEffect(() => clearClickSuppressionTimer, [clearClickSuppressionTimer])

  const suppressNextClick = useCallback(() => {
    clearClickSuppressionTimer()
    suppressClickRef.current = true
    clickSuppressionTimerRef.current = setTimeout(() => {
      suppressClickRef.current = false
      clickSuppressionTimerRef.current = null
    }, CLICK_SUPPRESSION_DURATION)
  }, [clearClickSuppressionTimer])

  const navigate = useCallback(
    (direction: SwipeDirection, swipe: SwipeEventData) => {
      if (!hasHorizontalSwipeIntent(swipe.absX, swipe.absY)) return

      const target = swipe.event.target
      if (
        target instanceof Element &&
        target.closest(INTERACTIVE_TARGET_SELECTOR)
      ) {
        return
      }

      suppressNextClick()
      const nextTagId = getAdjacentTagId(tags, activeTagId, direction)
      if (nextTagId) onSelectTag(nextTagId)
    },
    [activeTagId, onSelectTag, suppressNextClick, tags],
  )

  const swipeHandlers = useSwipeable({
    delta: MIN_SWIPE_DISTANCE,
    onSwipedLeft: (swipe) => navigate('next', swipe),
    onSwipedRight: (swipe) => navigate('previous', swipe),
    preventScrollOnSwipe: false,
    swipeDuration: MAX_SWIPE_DURATION,
    trackMouse: false,
    trackTouch: true,
  })

  const onClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (!suppressClickRef.current) return

      event.preventDefault()
      event.stopPropagation()
      suppressClickRef.current = false
      clearClickSuppressionTimer()
    },
    [clearClickSuppressionTimer],
  )

  return {
    ...swipeHandlers,
    onClickCapture,
  }
}
