import { ListEvents } from '@/components/Event/ListEvents'
import { Suspense } from 'react'

export default function Home() {
  return (
    <main className="grid gap-3 pb-28">
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
