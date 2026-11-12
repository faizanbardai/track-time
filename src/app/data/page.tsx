'use client'

import { BackupAndRestore } from '@/components/Backup/BackupAndRestore'
import { DemoData } from '@/components/Backup/DemoData'

export default function DataPage() {
  return (
    <main className="grid min-w-0 content-start gap-4 pb-24">
      <DemoData />
      <BackupAndRestore />
    </main>
  )
}
