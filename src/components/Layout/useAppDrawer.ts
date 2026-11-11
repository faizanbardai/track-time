'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import { hasHorizontalSwipeIntent } from '@/components/ui/useSwipeNavigation'

const INTERACTIVE_TARGET_SELECTOR =
  'a, button, input, select, textarea, label, [role="button"], [contenteditable="true"]'

const resetDrawerPosition = (drawer: HTMLElement | null) => {
  if (!drawer) return
  drawer.style.transition = 'translate 180ms cubic-bezier(0.22, 1, 0.36, 1)'
  drawer.style.translate = ''
}

export function useAppDrawer() {
  const [open, setOpen] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)
  const drawerRef = useRef<HTMLElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const closeDrawer = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    const drawer = drawerRef.current
    if (drawer) {
      drawer.style.transition = 'translate 200ms cubic-bezier(0.22, 1, 0.36, 1)'
      drawer.style.translate = ''
    }
    setPanelVisible(false)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOpen(false)
    } else {
      closeTimerRef.current = setTimeout(() => setOpen(false), 220)
    }
  }, [])

  const swipeHandlers = useSwipeable({
    delta: 8,
    onSwiping: (swipe) => {
      const target = swipe.event.target
      if (
        swipe.deltaX >= 0 ||
        !hasHorizontalSwipeIntent(swipe.absX, swipe.absY) ||
        (target instanceof Element &&
          target.closest(INTERACTIVE_TARGET_SELECTOR))
      )
        return
      const drawer = drawerRef.current
      if (!drawer) return
      drawer.style.transition = 'translate 0ms'
      drawer.style.translate = `${Math.max(-drawer.clientWidth, swipe.deltaX)}px 0`
    },
    onSwiped: (swipe) => {
      const target = swipe.event.target
      const drawerWidth = drawerRef.current?.clientWidth ?? 0
      const closeDistance = Math.max(80, drawerWidth * 0.25)
      const isInteractive =
        target instanceof Element && target.closest(INTERACTIVE_TARGET_SELECTOR)
      const shouldClose =
        swipe.deltaX < 0 &&
        hasHorizontalSwipeIntent(swipe.absX, swipe.absY) &&
        !isInteractive &&
        (swipe.absX >= closeDistance ||
          (swipe.absX >= 24 && Math.abs(swipe.vxvy[0]) >= 0.45))

      if (shouldClose) closeDrawer()
      else resetDrawerPosition(drawerRef.current)
    },
    preventScrollOnSwipe: false,
    trackMouse: true,
    trackTouch: true,
  })

  const { ref: swipeRef, ...swipeProps } = swipeHandlers
  const setDrawerRef = useCallback(
    (element: HTMLElement | null) => {
      drawerRef.current = element
      swipeRef(element)
    },
    [swipeRef],
  )

  useEffect(() => {
    if (!open) return
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    const frame = requestAnimationFrame(() => setPanelVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    },
    [],
  )

  return {
    open,
    setOpen,
    panelVisible,
    drawerRef,
    closeDrawer,
    swipeProps,
    setDrawerRef,
    resetDrawerPosition: () => resetDrawerPosition(drawerRef.current),
  }
}
