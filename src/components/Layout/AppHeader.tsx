'use client'

import Link from 'next/link'
import { CalendarClock, DatabaseBackup, Menu, Tags, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import { cn } from '@/lib/utils'

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
      'a[href], button:not([disabled])',
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
          'a[href], button:not([disabled])',
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
        <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-3 px-2">
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
          <Link href={PATHS.HOME} className="font-semibold tracking-tight">
            {pageTitle}
          </Link>
        </div>
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
            'relative flex h-full w-[min(20rem,85vw)] flex-col border-r bg-background shadow-xl will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
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
                <Link
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
                </Link>
              )
            })}
          </nav>
        </aside>
      </div>
    </>
  )
}
