import { ArrowRight, CalendarClock, DatabaseBackup, Tags } from 'lucide-react'
import { useMemo } from 'react'
import { MemoizedListEvent } from '@/components/Event/ListEvent'
import { useEventListClock } from '@/components/Event/EventListClock'
import { OfflineAwareLink } from '@/components/OfflineAwareLink'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import { getEmptyEventExamples } from '@/helpers/emptyEventExamples'

const ExampleEvent = () => {
  const clock = useEventListClock()
  const today = clock.format('YYYY-MM-DD')
  const examples = useMemo(() => getEmptyEventExamples(today), [today])

  return (
    <section aria-labelledby="example-events-heading" className="grid gap-4">
      <h2
        id="example-events-heading"
        className="text-sm font-semibold tracking-tight"
      >
        Three ways to mark time
      </h2>
      <div className="relative grid gap-4">
        <div
          aria-hidden="true"
          className="absolute bottom-5 left-[5px] top-2 w-px bg-border"
        />
        {examples.map(({ label, event }) => (
          <div
            key={event.id}
            className="relative grid grid-cols-[12px_minmax(0,1fr)] gap-3"
          >
            <span
              aria-hidden="true"
              className="mt-1.5 size-3 rounded-full border-2 border-primary bg-background"
            />
            <div className="grid min-w-0 gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {label}
              </p>
              <MemoizedListEvent
                event={event}
                liveCounter
                interactive={false}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export const EmptyEvents = () => (
  <section className="mx-auto grid w-full max-w-5xl content-center gap-10 px-1 py-10 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
    <div className="grid content-start gap-6">
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CalendarClock aria-hidden="true" className="size-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          Countdowns · count-ups · intervals
        </p>
      </div>
      <div className="grid gap-3">
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Count down to what’s next. Count up from what matters.
        </h1>
        <p className="max-w-xl text-muted-foreground sm:text-lg">
          See the time until a date, the time since it passed, or progress
          through an interval.
        </p>
      </div>
      <div className="grid justify-items-start gap-3">
        <Button asChild size="lg" className="h-11 px-5">
          <OfflineAwareLink href={PATHS.EVENT}>
            Create your first event
            <ArrowRight aria-hidden="true" className="size-4" />
          </OfflineAwareLink>
        </Button>
        <p className="text-xs text-muted-foreground">
          Events stay in this browser. After your first online visit, the app
          works offline.
        </p>
      </div>
    </div>

    <div className="grid content-start gap-5">
      <ExampleEvent />
      <div className="grid gap-x-5 gap-y-3 border-t pt-4 sm:grid-cols-2">
        <OfflineAwareLink
          href={PATHS.TAGS}
          className="group flex min-w-0 items-start gap-3 rounded-md py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Tags
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <span className="grid gap-1">
            <span className="text-sm font-medium">Multiple tags</span>
            <span className="text-xs text-muted-foreground">
              Add several tags to events, then filter by tag.
            </span>
          </span>
        </OfflineAwareLink>
        <OfflineAwareLink
          href={PATHS.DATA}
          className="group flex min-w-0 items-start gap-3 rounded-md py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <DatabaseBackup
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <span className="grid gap-1">
            <span className="text-sm font-medium">Encrypted backups</span>
            <span className="text-xs text-muted-foreground">
              Export a password-protected copy and restore it later.
            </span>
          </span>
        </OfflineAwareLink>
      </div>
    </div>
  </section>
)
