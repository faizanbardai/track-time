'use client'

import Link from 'next/link'
import { forwardRef, type ComponentProps } from 'react'
import { isBrowserOffline } from '@/lib/offlineNavigation'

type OfflineAwareLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
}

export const OfflineAwareLink = forwardRef<
  HTMLAnchorElement,
  OfflineAwareLinkProps
>(function OfflineAwareLink({ href, onClick, ...props }, ref) {
  return (
    <Link
      href={href}
      ref={ref}
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || !isBrowserOffline()) return

        event.preventDefault()
        window.location.assign(href)
      }}
    />
  )
})
