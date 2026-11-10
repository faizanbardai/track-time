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
import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { useSettings } from '@/components/providers/settings'
import { Button } from '@/components/ui/button'
import { OfflineAwareLink } from '@/components/OfflineAwareLink'
import { PATHS } from '@/constants/paths'
import { cn } from '@/lib/utils'
import Container from '@/ui/Container/Container'

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
  const { theme, setTheme } = useTheme()
  const { timeFormat, setTimeFormat } = useSettings()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)

  const closeDrawer = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled])',
    )
    focusable?.[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDrawer()
        return
      }
      if (event.key !== 'Tab' || !drawerRef.current) return

      const items = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled])',
        ),
      )
      const first = items[0]
      const last = items.at(-1)
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Container className="flex h-14 items-center gap-3">
          <Button
            ref={triggerRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="app-navigation"
            onClick={() => setOpen(true)}
          >
            <Menu aria-hidden="true" />
          </Button>
          <OfflineAwareLink
            href={PATHS.HOME}
            className="font-semibold tracking-tight"
          >
            {pageTitle}
          </OfflineAwareLink>
        </Container>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-50 transition-[visibility] duration-300 motion-reduce:transition-none',
          open
            ? 'visible pointer-events-auto'
            : 'invisible pointer-events-none delay-300',
        )}
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          className={cn(
            'absolute inset-0 bg-black/50 transition-opacity duration-200 ease-out motion-reduce:transition-none',
            open ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => closeDrawer()}
        />
        <aside
          ref={drawerRef}
          id="app-navigation"
          role="dialog"
          aria-modal="true"
          aria-labelledby="navigation-title"
          className={cn(
            'relative flex h-full w-[min(20rem,85vw)] flex-col overflow-y-auto border-r bg-background shadow-xl will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-14 items-center justify-between border-b px-4">
            <h2 id="navigation-title" className="font-semibold">
              Track Time
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close navigation menu"
              onClick={() => closeDrawer()}
            >
              <X aria-hidden="true" />
            </Button>
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
          <section aria-labelledby="settings-title" className="border-t p-4">
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
          <div className="mt-auto border-t p-3">
            <a
              href="https://github.com/faizanbardai/track-time"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Code2 aria-hidden="true" className="size-5" />
              GitHub repository
              <ExternalLink
                aria-hidden="true"
                className="ml-auto size-4 text-muted-foreground"
              />
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}
