'use client'

import {
  Code2,
  ExternalLink,
  X,
  CalendarClock,
  DatabaseBackup,
  Tags,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import type { SwipeableHandlers } from 'react-swipeable'
import { Button } from '@/components/ui/button'
import { OfflineAwareLink } from '@/components/OfflineAwareLink'
import { PATHS } from '@/constants/paths'
import { cn } from '@/lib/utils'
import packageJson from '../../../package.json'
import { DrawerSettings } from './DrawerSettings'

const navigation = [
  {
    label: 'Events',
    href: PATHS.HOME,
    icon: CalendarClock,
    isActive: (path: string) =>
      path === PATHS.HOME ||
      path === PATHS.EVENT ||
      path.startsWith(`${PATHS.EVENT}/`),
  },
  {
    label: 'Edit tags',
    href: PATHS.TAGS,
    icon: Tags,
    isActive: (path: string) => path === PATHS.TAGS,
  },
  {
    label: 'Backup & restore',
    href: PATHS.DATA,
    icon: DatabaseBackup,
    isActive: (path: string) => path === PATHS.DATA,
  },
]

export function AppDrawer({
  panelVisible,
  swipeProps,
  setDrawerRef,
  closeDrawer,
  onTouchCancel,
}: {
  panelVisible: boolean
  swipeProps: Omit<SwipeableHandlers, 'ref'>
  setDrawerRef: (element: HTMLElement | null) => void
  closeDrawer: () => void
  onTouchCancel: () => void
}) {
  const pathname = usePathname()

  return (
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
          onTouchCancel={onTouchCancel}
          id="app-navigation"
          aria-labelledby="navigation-title"
          className={cn(
            'fixed inset-y-0 left-0 z-[51] flex h-dvh w-[min(20rem,85vw)] touch-pan-y flex-col overflow-y-auto border-r bg-background pt-[env(safe-area-inset-top)] shadow-xl will-change-transform transition-[translate] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
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
                  onClick={closeDrawer}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {item.label}
                </OfflineAwareLink>
              )
            })}
          </nav>
          <DrawerSettings />
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
  )
}
