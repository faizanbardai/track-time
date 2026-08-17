'use client'

import Link from 'next/link'
import { BackupAndRestore } from '@/components/Backup/BackupAndRestore'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'

export default function DataPage() {
  return (
    <main className="grid gap-4">
      <div>
        <Button asChild variant="outline">
          <Link href={PATHS.HOME}>Back to events</Link>
        </Button>
      </div>
      <BackupAndRestore />
    </main>
  )
}
