'use client'

import { ManageTags } from '@/components/Tag/ManageTags'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'

export default function TagsPage() {
  return (
    <div className="grid gap-4">
      <Button asChild variant="outline" className="justify-self-start">
        <Link href={PATHS.HOME}>
          <ArrowLeft aria-hidden="true" />
          Back to events
        </Link>
      </Button>
      <ManageTags />
    </div>
  )
}
