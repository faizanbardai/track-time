import { ListEvents } from '@/components/Event/ListEvents'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Link href={PATHS.EVENT}>
        <Button>Add New Entry</Button>
      </Link>
      <ListEvents />
    </>
  )
}
