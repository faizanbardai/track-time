'use client'

import { ManageTags } from '@/components/Tag/ManageTags'
import { ArrowLeft } from 'lucide-react'
import { OfflineAwareLink } from '@/components/OfflineAwareLink'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'

export default function TagsPage() {
  return (
    <div className="grid content-start gap-4">
      <Button asChild variant="outline" className="justify-self-start">
        <OfflineAwareLink href={PATHS.HOME}>
          <ArrowLeft aria-hidden="true" />
          Back to events
        </OfflineAwareLink>
      </Button>
      <ManageTags />
    </div>
  )
}
