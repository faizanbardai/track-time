import Link from 'next/link'
import PrimaryButton from '@/ui/Button/PrimaryButton'

export default function Home() {
  return (
    <Link href="/create">
      <PrimaryButton>Add New Entry</PrimaryButton>
    </Link>
  )
}
