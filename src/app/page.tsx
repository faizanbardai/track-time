import Link from 'next/link'
import PrimaryButton from '../ui/PrimaryButton'

export default function Home() {
  return (
    <Link href="/create">
      <PrimaryButton>Add New Entry</PrimaryButton>
    </Link>
  )
}
