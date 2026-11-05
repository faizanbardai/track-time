'use client'

import { BackupAndRestore } from '@/components/Backup/BackupAndRestore'
import { ArrowLeft } from 'lucide-react'
import { OfflineAwareLink } from '@/components/OfflineAwareLink'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'

export default function DataPage() {
  return (
    <main className="grid min-w-0 grid-rows-[auto_1fr] gap-4 pb-24">
      <Button asChild variant="outline" className="justify-self-start">
        <OfflineAwareLink href={PATHS.HOME}>
          <ArrowLeft aria-hidden="true" />
          Back to events
        </OfflineAwareLink>
      </Button>
      <BackupAndRestore />
    </main>
  )
}
