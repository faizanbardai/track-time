import { useEffect, useRef } from 'react'

const TAG_PEEK_WIDTH = 20
const TAG_SCROLLER_PADDING = 8

export const useActiveTagPeek = (activeTagId: string) => {
  const tagScrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tagScroller = tagScrollerRef.current
    const activeTag = tagScroller?.querySelector<HTMLElement>(
      '[aria-pressed="true"]',
    )
    if (!tagScroller || !activeTag) return

    const scrollerBounds = tagScroller.getBoundingClientRect()
    const activeBounds = activeTag.getBoundingClientRect()
    const previousTag = activeTag.previousElementSibling as HTMLElement | null
    const nextTag = activeTag.nextElementSibling as HTMLElement | null
    const previousBounds = previousTag?.getBoundingClientRect()
    const nextBounds = nextTag?.getBoundingClientRect()
    const viewportLeft = scrollerBounds.left + TAG_SCROLLER_PADDING
    const viewportRight = scrollerBounds.right - TAG_SCROLLER_PADDING
    const desiredLeft = previousBounds
      ? Math.max(previousBounds.left, previousBounds.right - TAG_PEEK_WIDTH)
      : activeBounds.left
    const desiredRight = nextBounds
      ? Math.min(nextBounds.right, nextBounds.left + TAG_PEEK_WIDTH)
      : activeBounds.right
    const minimumDelta = desiredRight - viewportRight
    const maximumDelta = desiredLeft - viewportLeft
    let scrollDelta = 0

    if (minimumDelta <= maximumDelta) {
      scrollDelta = Math.min(maximumDelta, Math.max(minimumDelta, 0))
    } else if (activeBounds.left < viewportLeft) {
      scrollDelta = activeBounds.left - viewportLeft
    } else if (desiredRight > viewportRight) {
      const requiredDelta = desiredRight - viewportRight
      const availableDelta = Math.max(0, activeBounds.left - viewportLeft)
      scrollDelta = Math.min(requiredDelta, availableDelta)
    }

    if (scrollDelta === 0) return

    tagScroller.scrollTo({
      left: tagScroller.scrollLeft + scrollDelta,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
  }, [activeTagId])

  return tagScrollerRef
}
