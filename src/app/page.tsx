import { ListEvents } from '@/components/Event/ListEvents'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import Link from 'next/link'
import { Suspense } from 'react'

export default function Home() {
  return (
    <main className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={PATHS.EVENT}>Add New Entry</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={PATHS.TAGS}>Manage tags</Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <div className="text-center text-muted-foreground py-12">
            Loading events...
          </div>
        }
      >
        <ListEvents />
      </Suspense>
    </main>
  )
}
