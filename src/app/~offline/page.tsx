import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <main className="grid justify-items-start gap-3 py-12">
      <h1 className="text-2xl font-semibold">You’re offline</h1>
      <p className="max-w-prose text-muted-foreground">
        Reconnect to load this page. Previously cached parts of Time Tracker and
        your locally stored entries remain available on this device.
      </p>
      <Button asChild>
        <Link href="/">Try again</Link>
      </Button>
    </main>
  )
}
