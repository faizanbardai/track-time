import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ALL_TAG_ID } from '@/helpers/indexedDB'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import type { Tag } from '@/types/event'

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
      variant={active ? 'default' : 'ghost'}
      size="sm"
      className="shrink-0 rounded-full"
      aria-pressed={active}
      disabled={active}
      onClick={() => onSelectTag(tag.id)}
    >
      {tag.name}
    </Button>
  )
}

export const EventBottomBar = ({
  activeTagId,
  tags,
  onSelectTag,
}: EventBottomBarProps) => {
  const allTag = tags.find(({ id }) => id === ALL_TAG_ID)
  const customTags = tags.filter(({ id }) => id !== ALL_TAG_ID)

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

      <nav
        aria-label="Filter events by tag"
        className="flex h-14 items-center overflow-hidden rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85"
      >
        {allTag && (
          <div className="shrink-0 border-r px-1 pr-2">
            <TagButton
              tag={allTag}
              activeTagId={activeTagId}
              onSelectTag={onSelectTag}
            />
          </div>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {customTags.map((tag) => (
            <TagButton
              key={tag.id}
              tag={tag}
              activeTagId={activeTagId}
              onSelectTag={onSelectTag}
            />
          ))}
        </div>
      </nav>
    </div>
  )
}
