import Link from 'next/link'
import { Clock3, Plus } from 'lucide-react'
import { ALL_TAG_ID, UPCOMING_TAG_ID } from '@/helpers/indexedDB'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import type { Tag } from '@/types/event'
import { useActiveTagPeek } from '@/components/Event/useActiveTagPeek'
import { cn } from '@/lib/utils'
import { BottomPill } from '@/components/ui/BottomPill'

interface EventBottomBarProps {
  activeTagId: string
  tags: Tag[]
  onSelectTag: (tagId: string) => void
}

const TagButton = ({
  tag,
  activeTagId,
  onSelectTag,
}: {
  tag: Tag
  activeTagId: string
  onSelectTag: (tagId: string) => void
}) => {
  const active = tag.id === activeTagId

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="group h-11 min-w-11 shrink-0 scroll-mx-2 rounded-full px-1 py-0 hover:bg-transparent dark:hover:bg-transparent"
      aria-pressed={active}
      onClick={() => !active && onSelectTag(tag.id)}
    >
      <span
        className={cn(
          'inline-flex h-8 items-center rounded-full px-3 transition-colors',
          active
            ? 'bg-primary text-primary-foreground shadow-xs group-hover:bg-primary/90'
            : 'group-hover:bg-accent group-hover:text-accent-foreground dark:group-hover:bg-accent/50',
        )}
      >
        {tag.name}
      </span>
    </Button>
  )
}

const UpcomingButton = ({
  activeTagId,
  onSelectTag,
}: Pick<EventBottomBarProps, 'activeTagId' | 'onSelectTag'>) => {
  const active = activeTagId === UPCOMING_TAG_ID

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="group size-11 shrink-0 rounded-full hover:bg-transparent dark:hover:bg-transparent"
      aria-label="Upcoming events"
      title="Upcoming events"
      aria-pressed={active}
      onClick={() => !active && onSelectTag(UPCOMING_TAG_ID)}
    >
      <span
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-full transition-colors',
          active
            ? 'bg-primary text-primary-foreground shadow-xs group-hover:bg-primary/90'
            : 'group-hover:bg-accent group-hover:text-accent-foreground dark:group-hover:bg-accent/50',
        )}
      >
        <Clock3 aria-hidden="true" className="size-4" />
      </span>
    </Button>
  )
}

export const EventBottomBar = ({
  activeTagId,
  tags,
  onSelectTag,
}: EventBottomBarProps) => {
  const allTag = tags.find(({ id }) => id === ALL_TAG_ID)
  const customTags = tags.filter(
    ({ id }) => id !== ALL_TAG_ID && id !== UPCOMING_TAG_ID,
  )
  const tagScrollerRef = useActiveTagPeek(activeTagId)

  return (
    <div className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 w-[calc(100%-1rem)] max-w-[1184px] -translate-x-1/2">
      <Button
        asChild
        size="icon"
        className="absolute right-2 bottom-16 z-10 size-14 rounded-full shadow-lg"
      >
        <Link
          href={PATHS.EVENT}
          aria-label="Add new entry"
          title="Add new entry"
        >
          <Plus aria-hidden="true" className="size-6" />
        </Link>
      </Button>

      <nav aria-label="Filter events by tag">
        <BottomPill>
          {allTag && (
            <div className="shrink-0 border-r px-1 pr-2">
              <TagButton
                tag={allTag}
                activeTagId={activeTagId}
                onSelectTag={onSelectTag}
              />
            </div>
          )}
          <div className="shrink-0 border-r px-1 pr-2">
            <UpcomingButton
              activeTagId={activeTagId}
              onSelectTag={onSelectTag}
            />
          </div>
          <div
            ref={tagScrollerRef}
            className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {customTags.map((tag) => (
              <TagButton
                key={tag.id}
                tag={tag}
                activeTagId={activeTagId}
                onSelectTag={onSelectTag}
              />
            ))}
          </div>
        </BottomPill>
      </nav>
    </div>
  )
}
