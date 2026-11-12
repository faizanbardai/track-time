'use client'

import { ChevronRight, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { OfflineAwareLink } from '@/components/OfflineAwareLink'
import { PATHS } from '@/constants/paths'
import { NAVIGATION_LABELS } from '@/constants/navigation'
import Container from '@/ui/Container/Container'
import { AppDrawer } from './AppDrawer'
import { useAppDrawer } from './useAppDrawer'
import { useHeaderBreadcrumb } from './useHeaderBreadcrumb'

export const AppHeader = () => {
  const pathname = usePathname()
  const breadcrumb = useHeaderBreadcrumb(pathname)
  const drawer = useAppDrawer()

  return (
    <Dialog.Root
      open={drawer.open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) drawer.setOpen(true)
        else drawer.closeDrawer()
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
              onClick={drawer.resetDrawerPosition}
            >
              <Menu aria-hidden="true" className="size-6" />
            </Button>
          </Dialog.Trigger>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            {breadcrumb.hasParent ? (
              <ol className="flex min-w-0 items-center gap-1 text-sm">
                <li className="shrink-0">
                  <OfflineAwareLink
                    href={PATHS.HOME}
                    className="inline-flex min-h-11 items-center rounded-sm text-foreground/80 underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {NAVIGATION_LABELS.events}
                  </OfflineAwareLink>
                </li>
                <li
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground"
                >
                  <ChevronRight className="size-4" />
                </li>
                <li className="min-w-0 text-base font-semibold tracking-tight">
                  <span aria-current="page" className="block truncate">
                    {breadcrumb.label}
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="flex min-w-0 items-center text-sm">
                <li className="min-w-0 text-base font-semibold tracking-tight">
                  <span aria-current="page" className="block truncate">
                    {NAVIGATION_LABELS.events}
                  </span>
                </li>
              </ol>
            )}
          </nav>
        </Container>
      </header>
      <AppDrawer
        panelVisible={drawer.panelVisible}
        swipeProps={drawer.swipeProps}
        setDrawerRef={drawer.setDrawerRef}
        closeDrawer={drawer.closeDrawer}
        onTouchCancel={drawer.resetDrawerPosition}
      />
    </Dialog.Root>
  )
}
