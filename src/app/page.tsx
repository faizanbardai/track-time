import { ListEvents } from '@/components/Event/ListEvents'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import Link from 'next/link'

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
      <ListEvents />
    </main>
  )
}
