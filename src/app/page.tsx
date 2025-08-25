import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <Link href="/create">
      <Button>Add New Entry</Button>
    </Link>
  )
}
