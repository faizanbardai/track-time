import { ListEvents } from '@/components/Event/ListEvents'
import { Suspense } from 'react'

export default function Home() {
  return (
    <main className="grid min-w-0 grid-rows-[1fr] gap-3 pb-40">
      <Suspense fallback={<div aria-busy="true" />}>
        <ListEvents />
      </Suspense>
    </main>
  )
}
