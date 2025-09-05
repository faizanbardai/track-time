import { ListEvents } from '@/components/ListEvents'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Link href="/event">
        <Button>Add New Entry</Button>
      </Link>
      <ListEvents />
    </>
  )
}
