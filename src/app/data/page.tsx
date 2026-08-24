'use client'

import { BackupAndRestore } from '@/components/Backup/BackupAndRestore'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'

export default function DataPage() {
  return (
    <main className="grid gap-4">
      <Button asChild variant="outline" className="justify-self-start">
        <Link href={PATHS.HOME}>
          <ArrowLeft aria-hidden="true" />
          Back to events
        </Link>
      </Button>
      <BackupAndRestore />
    </main>
  )
}
