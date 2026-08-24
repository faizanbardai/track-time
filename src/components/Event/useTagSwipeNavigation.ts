import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { type SwipeEventData, useSwipeable } from 'react-swipeable'
import type { Tag } from '@/types/event'

const TRACKING_DELTA = 8
const HORIZONTAL_INTENT_RATIO = 1.25
const COMMIT_DISTANCE_RATIO = 0.22
const MAX_COMMIT_DISTANCE = 120
const MIN_FLING_DISTANCE = 24
const COMMIT_VELOCITY = 0.45
const EDGE_RESISTANCE = 0.18
const SETTLE_DURATION = 260
const CLICK_SUPPRESSION_DURATION = 500
const INTERACTIVE_TARGET_SELECTOR =
  'a, button, input, select, textarea, [role="button"]:not([data-swipe-navigation-drag-surface]), [data-swipe-navigation-ignore]'

type SwipeDirection = 'next' | 'previous'

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const hasHorizontalSwipeIntent = (absX: number, absY: number) =>
  absX >= absY * HORIZONTAL_INTENT_RATIO

export const shouldCompleteTagSwipe = (
  absX: number,
  absY: number,
  velocityX: number,
  viewportWidth: number,
) => {
  if (!hasHorizontalSwipeIntent(absX, absY)) return false

  const distanceThreshold = Math.min(
    viewportWidth * COMMIT_DISTANCE_RATIO,
    MAX_COMMIT_DISTANCE,
  )
  return (
    absX >= distanceThreshold ||
    (absX >= MIN_FLING_DISTANCE && Math.abs(velocityX) >= COMMIT_VELOCITY)
  )
}

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
  disabled = false,
}: {
  activeTagId: string
  tags: Tag[]
  onSelectTag: (tagId: string) => void
  disabled?: boolean
}) => {
  const pagerRef = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const suppressClickRef = useRef(false)
  const clickSuppressionTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [isSettling, setIsSettling] = useState(false)

  const clearClickSuppressionTimer = useCallback(() => {
    if (clickSuppressionTimerRef.current !== null) {
      clearTimeout(clickSuppressionTimerRef.current)
      clickSuppressionTimerRef.current = null
    }
  }, [])

  useEffect(() => clearClickSuppressionTimer, [clearClickSuppressionTimer])

  const clearSettleTimer = useCallback(() => {
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current)
      settleTimerRef.current = null
    }
  }, [])

  useEffect(() => clearSettleTimer, [clearSettleTimer])

  const updateTrack = useCallback((offset: number, animate: boolean) => {
    const track = trackRef.current
    if (!track) return

    track.style.transition = animate
      ? `transform ${SETTLE_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`
      : 'none'
    track.style.transform = `translate3d(${offset}px, 0, 0)`
  }, [])

  useLayoutEffect(() => {
    if (isSettling) return
    clearSettleTimer()
    updateTrack(0, false)
    setIsSettling(false)
  }, [activeTagId, clearSettleTimer, disabled, isSettling, updateTrack])

  const suppressNextClick = useCallback(() => {
    clearClickSuppressionTimer()
    suppressClickRef.current = true
    clickSuppressionTimerRef.current = setTimeout(() => {
      suppressClickRef.current = false
      clickSuppressionTimerRef.current = null
    }, CLICK_SUPPRESSION_DURATION)
  }, [clearClickSuppressionTimer])

  const isIgnoredTarget = useCallback((swipe: SwipeEventData) => {
    const target = swipe.event.target
    return (
      target instanceof Element &&
      Boolean(target.closest(INTERACTIVE_TARGET_SELECTOR))
    )
  }, [])

  const settleAtCenter = useCallback(() => {
    clearSettleTimer()
    if (prefersReducedMotion()) {
      updateTrack(0, false)
      setIsSettling(false)
      return
    }

    setIsSettling(true)
    updateTrack(0, true)
    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null
      updateTrack(0, false)
      setIsSettling(false)
    }, SETTLE_DURATION)
  }, [clearSettleTimer, updateTrack])

  const handleSwiping = useCallback(
    (swipe: SwipeEventData) => {
      if (disabled || isSettling || isIgnoredTarget(swipe)) return

      if (!hasHorizontalSwipeIntent(swipe.absX, swipe.absY)) {
        updateTrack(0, false)
        return
      }

      const direction: SwipeDirection = swipe.deltaX < 0 ? 'next' : 'previous'
      const adjacentTagId = getAdjacentTagId(tags, activeTagId, direction)
      const offset = adjacentTagId
        ? swipe.deltaX
        : swipe.deltaX * EDGE_RESISTANCE
      updateTrack(offset, false)
    },
    [activeTagId, disabled, isIgnoredTarget, isSettling, tags, updateTrack],
  )

  const handleSwiped = useCallback(
    (swipe: SwipeEventData) => {
      if (disabled) {
        updateTrack(0, false)
        return
      }

      if (isIgnoredTarget(swipe)) {
        updateTrack(0, false)
        return
      }

      if (!hasHorizontalSwipeIntent(swipe.absX, swipe.absY)) {
        updateTrack(0, false)
        return
      }

      suppressNextClick()
      const direction: SwipeDirection = swipe.deltaX < 0 ? 'next' : 'previous'
      const adjacentTagId = getAdjacentTagId(tags, activeTagId, direction)
      const viewportWidth = pagerRef.current?.clientWidth ?? 0
      const shouldComplete =
        adjacentTagId !== null &&
        viewportWidth > 0 &&
        shouldCompleteTagSwipe(
          swipe.absX,
          swipe.absY,
          swipe.vxvy[0],
          viewportWidth,
        )

      if (!shouldComplete || !adjacentTagId) {
        settleAtCenter()
        return
      }

      if (prefersReducedMotion()) {
        updateTrack(0, false)
        onSelectTag(adjacentTagId)
        return
      }

      clearSettleTimer()
      setIsSettling(true)
      updateTrack(direction === 'next' ? -viewportWidth : viewportWidth, true)
      onSelectTag(adjacentTagId)
      settleTimerRef.current = setTimeout(() => {
        settleTimerRef.current = null
        updateTrack(0, false)
        setIsSettling(false)
      }, SETTLE_DURATION)
    },
    [
      activeTagId,
      clearSettleTimer,
      disabled,
      isIgnoredTarget,
      onSelectTag,
      settleAtCenter,
      suppressNextClick,
      tags,
      updateTrack,
    ],
  )

  const swipeHandlers = useSwipeable({
    delta: TRACKING_DELTA,
    onSwiped: handleSwiped,
    onSwiping: handleSwiping,
    preventScrollOnSwipe: false,
    trackMouse: false,
    trackTouch: true,
  })
  const swipeRef = swipeHandlers.ref
  const cancelSwipe = useCallback(() => {
    clearSettleTimer()
    updateTrack(0, false)
    setIsSettling(false)
  }, [clearSettleTimer, updateTrack])
  const setPagerRef = useCallback(
    (element: HTMLElement | null) => {
      pagerRef.current = element
      swipeRef(element)
    },
    [swipeRef],
  )

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
    bind: {
      ...swipeHandlers,
      ref: setPagerRef,
      onClickCapture,
      onTouchCancel: cancelSwipe,
    },
    isSettling,
    trackRef,
  }
}
