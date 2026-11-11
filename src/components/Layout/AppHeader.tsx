'use client'

import {
  CalendarClock,
  Code2,
  DatabaseBackup,
  ExternalLink,
  Menu,
  Settings2,
  Tags,
  X,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import * as Dialog from '@radix-ui/react-dialog'
import { useTheme } from 'next-themes'
import { useSettings } from '@/components/providers/settings'
import { Button } from '@/components/ui/button'
import { hasHorizontalSwipeIntent } from '@/components/ui/useSwipeNavigation'
import { OfflineAwareLink } from '@/components/OfflineAwareLink'
import { PATHS } from '@/constants/paths'
import { cn } from '@/lib/utils'
import Container from '@/ui/Container/Container'
import packageJson from '../../../package.json'

const navigation = [
  {
    label: 'Events',
    href: PATHS.HOME,
    icon: CalendarClock,
    isActive: (pathname: string) =>
      pathname === PATHS.HOME ||
      pathname === PATHS.EVENT ||
      pathname.startsWith(`${PATHS.EVENT}/`),
  },
  {
    label: 'Edit tags',
    href: PATHS.TAGS,
    icon: Tags,
    isActive: (pathname: string) => pathname === PATHS.TAGS,
  },
  {
    label: 'Backup & restore',
    href: PATHS.DATA,
    icon: DatabaseBackup,
    isActive: (pathname: string) => pathname === PATHS.DATA,
  },
]

const INTERACTIVE_TARGET_SELECTOR =
  'a, button, input, select, textarea, label, [role="button"], [contenteditable="true"]'

export const AppHeader = () => {
  const pathname = usePathname()
  const pageTitle =
    pathname === PATHS.TAGS
      ? 'Manage tags'
      : pathname === PATHS.DATA
        ? 'Backup & restore'
        : pathname === PATHS.EVENT
          ? 'New event'
          : pathname.startsWith(`${PATHS.EVENT}/`)
            ? 'Edit event'
            : 'Track Time'
  const [open, setOpen] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)
  const { theme, setTheme } = useTheme()
  const { timeFormat, setTimeFormat } = useSettings()
  const drawerRef = useRef<HTMLElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const closeDrawer = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    const drawer = drawerRef.current
    if (drawer) {
      drawer.style.transition =
        'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), translate 180ms cubic-bezier(0.22, 1, 0.36, 1)'
      drawer.style.translate = '0px 0'
    }
    setPanelVisible(false)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOpen(false)
    } else {
      closeTimerRef.current = setTimeout(() => setOpen(false), 220)
    }
  }

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
      const drawerWidth = drawerRef.current?.clientWidth ?? 0
      const drawer = drawerRef.current
      if (drawer) {
        drawer.style.transition =
          'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), translate 0ms'
        drawer.style.translate = `${Math.max(-drawerWidth, swipe.deltaX)}px 0`
      }
    },
    onSwiped: (swipe) => {
      const target = swipe.event.target
      const drawerWidth = drawerRef.current?.clientWidth ?? 0
      const closeDistance = Math.max(80, drawerWidth * 0.25)
      const shouldClose =
        swipe.deltaX < 0 &&
        hasHorizontalSwipeIntent(swipe.absX, swipe.absY) &&
        !(
          target instanceof Element &&
          target.closest(INTERACTIVE_TARGET_SELECTOR)
        ) &&
        (swipe.absX >= closeDistance ||
          (swipe.absX >= 24 && Math.abs(swipe.vxvy[0]) >= 0.45))

      if (shouldClose) {
        closeDrawer()
      } else {
        const drawer = drawerRef.current
        if (drawer) {
          drawer.style.transition =
            'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), translate 180ms cubic-bezier(0.22, 1, 0.36, 1)'
          drawer.style.translate = '0px 0'
        }
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: true,
    trackTouch: true,
  })
  const { ref: swipeRef, ...swipeProps } = swipeHandlers
  const handleSwipeCancel = () => {
    const drawer = drawerRef.current
    if (drawer) {
      drawer.style.transition =
        'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), translate 180ms cubic-bezier(0.22, 1, 0.36, 1)'
      drawer.style.translate = '0px 0'
    }
  }
  const setDrawerRef = useCallback(
    (element: HTMLElement | null) => {
      drawerRef.current = element
      swipeRef(element)
    },
    [swipeRef],
  )

  useEffect(() => {
    const edgeGesture = {
      pointerId: -1,
      startX: 0,
      startY: 0,
      eligible: false,
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (open || !event.isPrimary || event.button !== 0) return
      const target = event.target
      const isInteractive =
        target instanceof Element &&
        target.closest(
          'a, button, input, select, textarea, label, [role="button"], [contenteditable="true"]',
        )
      edgeGesture.pointerId = event.pointerId
      edgeGesture.startX = event.clientX
      edgeGesture.startY = event.clientY
      edgeGesture.eligible = event.clientX <= 24 && !isInteractive
    }
    const handlePointerUp = (event: PointerEvent) => {
      if (edgeGesture.pointerId !== event.pointerId) return
      const deltaX = event.clientX - edgeGesture.startX
      const deltaY = event.clientY - edgeGesture.startY
      if (
        edgeGesture.eligible &&
        deltaX >= 48 &&
        deltaX >= Math.abs(deltaY) * 1.25
      ) {
        setOpen(true)
      }
      edgeGesture.pointerId = -1
    }
    const resetGesture = () => {
      edgeGesture.pointerId = -1
    }

    window.addEventListener('pointerdown', handlePointerDown, true)
    window.addEventListener('pointerup', handlePointerUp, true)
    window.addEventListener('pointercancel', resetGesture, true)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true)
      window.removeEventListener('pointerup', handlePointerUp, true)
      window.removeEventListener('pointercancel', resetGesture, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    const frame = requestAnimationFrame(() => setPanelVisible(true))

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [open])

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    },
    [],
  )

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true)
            return
          }
          closeDrawer()
        }}
      >
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Container className="flex h-14 items-center gap-3">
            <Dialog.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                aria-controls="app-navigation"
                className="min-h-11 min-w-11"
                onClick={() => {
                  if (drawerRef.current) {
                    drawerRef.current.style.transition = ''
                    drawerRef.current.style.translate = '0px 0'
                  }
                }}
              >
                <Menu aria-hidden="true" />
              </Button>
            </Dialog.Trigger>
            <OfflineAwareLink
              href={PATHS.HOME}
              className="font-semibold tracking-tight"
            >
              {pageTitle}
            </OfflineAwareLink>
          </Container>
        </header>

        <Dialog.Portal>
          <Dialog.Overlay
            data-testid="navigation-overlay"
            className={cn(
              'fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ease-out motion-reduce:transition-none',
              panelVisible ? 'opacity-100' : 'opacity-0',
            )}
            onClick={closeDrawer}
          />
          <Dialog.Content asChild>
            <aside
              {...swipeProps}
              ref={setDrawerRef}
              onTouchCancel={handleSwipeCancel}
              id="app-navigation"
              aria-labelledby="navigation-title"
              className={cn(
                'fixed inset-y-0 left-0 z-[51] flex h-dvh w-[min(20rem,85vw)] touch-pan-y flex-col overflow-y-auto border-r bg-background pt-[env(safe-area-inset-top)] shadow-xl will-change-transform transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                panelVisible ? 'translate-x-0' : '-translate-x-full',
              )}
            >
              <div className="flex h-14 items-center justify-between border-b px-4">
                <h2 id="navigation-title" className="font-semibold">
                  Track Time
                </h2>
                <Dialog.Close asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Close navigation menu"
                    className="min-h-11 min-w-11"
                  >
                    <X aria-hidden="true" />
                  </Button>
                </Dialog.Close>
              </div>
              <nav aria-label="Main navigation" className="grid gap-1 p-3">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const active = item.isActive(pathname)
                  return (
                    <OfflineAwareLink
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
                        active && 'bg-accent text-accent-foreground',
                      )}
                      onClick={() => closeDrawer()}
                    >
                      <Icon aria-hidden="true" className="size-5" />
                      {item.label}
                    </OfflineAwareLink>
                  )
                })}
              </nav>
              <section
                aria-labelledby="settings-title"
                className="border-t p-4"
              >
                <h3
                  id="settings-title"
                  className="mb-3 flex items-center gap-2 text-sm font-semibold"
                >
                  <Settings2 aria-hidden="true" className="size-4" />
                  Settings
                </h3>
                <div className="grid gap-3">
                  <fieldset className="grid gap-1.5">
                    <legend className="text-xs font-medium text-muted-foreground">
                      Time format
                    </legend>
                    <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/50 p-1">
                      {(['12h', '24h'] as const).map((format) => (
                        <label
                          key={format}
                          className="cursor-pointer rounded-md text-center text-sm font-medium has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-sm"
                        >
                          <input
                            type="radio"
                            name="time-format"
                            value={format}
                            checked={timeFormat === format}
                            onChange={() => setTimeFormat(format)}
                            className="peer sr-only"
                          />
                          <span className="block rounded-md px-3 py-1.5 text-muted-foreground peer-checked:text-foreground peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ring">
                            {format}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="grid gap-1.5">
                    <legend className="text-xs font-medium text-muted-foreground">
                      Theme
                    </legend>
                    <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/50 p-1">
                      {(['light', 'dark', 'system'] as const).map((option) => (
                        <label
                          key={option}
                          className="cursor-pointer rounded-md text-center text-sm font-medium capitalize has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-sm"
                        >
                          <input
                            type="radio"
                            name="app-theme"
                            value={option}
                            checked={(theme ?? 'system') === option}
                            onChange={() => setTheme(option)}
                            className="peer sr-only"
                          />
                          <span className="block rounded-md px-2 py-1.5 text-muted-foreground peer-checked:text-foreground peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ring">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </section>
              <div className="mt-auto border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <a
                  href="https://github.com/faizanbardai/track-time"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Code2 aria-hidden="true" className="size-5" />
                  <span className="leading-none">GitHub repository</span>
                  <span className="inline-flex items-center rounded border bg-muted px-1.5 py-1 text-[11px] leading-none font-medium text-muted-foreground">
                    v{packageJson.version}
                  </span>
                  <ExternalLink
                    aria-hidden="true"
                    className="ml-auto size-4 text-muted-foreground"
                  />
                </a>
              </div>
            </aside>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
