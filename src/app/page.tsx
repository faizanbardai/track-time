import { ListEvents } from '@/components/Event/ListEvents'
import { Suspense } from 'react'

export default function Home() {
  return (
    <main className="grid min-h-[calc(100dvh-4.5rem)] grid-rows-[1fr] gap-3 pb-40">
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
