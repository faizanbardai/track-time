'use client'

import Link from 'next/link'
import { ManageTags } from '@/components/Tag/ManageTags'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'

export default function TagsPage() {
  return (
    <div className="grid gap-4">
      <div>
        <Button asChild variant="outline">
          <Link href={PATHS.HOME}>Back to events</Link>
        </Button>
      </div>
      <ManageTags />
    </div>
  )
}
