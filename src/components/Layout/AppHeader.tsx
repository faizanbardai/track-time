'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { OfflineAwareLink } from '@/components/OfflineAwareLink'
import { PATHS } from '@/constants/paths'
import Container from '@/ui/Container/Container'
import { AppDrawer } from './AppDrawer'
import { useAppDrawer } from './useAppDrawer'

const getPageTitle = (pathname: string) => {
  if (pathname === PATHS.TAGS) return 'Manage tags'
  if (pathname === PATHS.DATA) return 'Backup & restore'
  if (pathname === PATHS.EVENT) return 'New event'
  if (pathname.startsWith(`${PATHS.EVENT}/`)) return 'Edit event'
  return 'Track Time'
}

export const AppHeader = () => {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
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
