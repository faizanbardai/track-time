'use client'

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
  ArrowDownWideNarrow,
  ArrowDownUp,
  ArrowUpWideNarrow,
  CakeSlice,
  Check,
  ChevronDown,
  Clock3,
  List as ListIcon,
} from 'lucide-react'
import {
  ALL_TAG_ID,
  ANNIVERSARY_TAG_ID,
  UPCOMING_TAG_ID,
} from '@/helpers/indexedDB'
import { Button } from '@/components/ui/button'
import type { Tag } from '@/types/event'
import type { EventSortMode } from '@/components/Event/useListEvents'
import { useActiveTagPeek } from '@/components/Event/useActiveTagPeek'
import { cn } from '@/lib/utils'
import { BottomBar } from '@/components/ui/BottomBar'
import { BottomPill } from '@/components/ui/BottomPill'

interface EventBottomBarProps {
  activeTagId: string
  tags: Tag[]
  sortMode: EventSortMode
  onSelectTag: (tagId: string) => void
  onToggleSort: () => void
}

const VIEWS = [
  { id: ALL_TAG_ID, label: 'All events', Icon: ListIcon },
  { id: UPCOMING_TAG_ID, label: 'Upcoming', Icon: Clock3 },
  { id: ANNIVERSARY_TAG_ID, label: 'Anniversary', Icon: CakeSlice },
] as const

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
          'inline-flex h-8 items-center rounded-full px-3 text-[15px] transition-colors',
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

export const EventBottomBar = ({
  activeTagId,
  tags,
  sortMode,
  onSelectTag,
  onToggleSort,
}: EventBottomBarProps) => {
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const viewPickerRef = useRef<HTMLDivElement>(null)
  const viewButtonRef = useRef<HTMLButtonElement>(null)
  const currentView = VIEWS.find(({ id }) => id === activeTagId)
  const CurrentViewIcon = currentView?.Icon ?? ListIcon
  const customTags = tags.filter(
    ({ id }) =>
      id !== ALL_TAG_ID && id !== UPCOMING_TAG_ID && id !== ANNIVERSARY_TAG_ID,
  )
  const tagScrollerRef = useActiveTagPeek(activeTagId)

  useEffect(() => {
    if (!viewMenuOpen) return

    const closeOnOutsideInteraction = (event: Event) => {
      if (!viewPickerRef.current?.contains(event.target as Node)) {
        setViewMenuOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setViewMenuOpen(false)
        viewButtonRef.current?.focus()
      }
    }
    const menu = viewPickerRef.current?.querySelector('[role="menu"]')
    const selectedOption =
      menu?.querySelector<HTMLElement>(
        '[role="menuitemradio"][aria-checked="true"]',
      ) ?? menu?.querySelector<HTMLElement>('[role="menuitemradio"]')
    selectedOption?.focus()

    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    document.addEventListener('focusin', closeOnOutsideInteraction)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideInteraction)
      document.removeEventListener('focusin', closeOnOutsideInteraction)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [viewMenuOpen])

  const handleViewMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const options = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitemradio"]',
      ),
    )
    const activeIndex = options.indexOf(
      document.activeElement as HTMLButtonElement,
    )
    let nextIndex: number | null = null

    if (event.key === 'ArrowDown')
      nextIndex = (activeIndex + 1) % options.length
    if (event.key === 'ArrowUp')
      nextIndex = (activeIndex - 1 + options.length) % options.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = options.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    options[nextIndex]?.focus()
  }

  const sortDescription =
    sortMode === 'user'
      ? 'user order'
      : sortMode === 'asc'
        ? activeTagId === ANNIVERSARY_TAG_ID
          ? 'closest anniversary first'
          : 'ascending by start date'
        : activeTagId === ANNIVERSARY_TAG_ID
          ? 'farthest anniversary first'
          : 'descending by start date'
  const SortIcon =
    sortMode === 'asc'
      ? ArrowUpWideNarrow
      : sortMode === 'desc'
        ? ArrowDownWideNarrow
        : ArrowDownUp

  return (
    <BottomBar className="max-w-[1184px]">
      <nav aria-label="Event views and tag filters">
        <div className="flex items-center gap-2">
          <div className="relative shrink-0" ref={viewPickerRef}>
            <Button
              ref={viewButtonRef}
              type="button"
              variant="outline"
              className="h-14 w-[4.5rem] rounded-full bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
              aria-label={`Choose view: ${currentView?.label ?? 'tag events'}`}
              aria-haspopup="menu"
              aria-expanded={viewMenuOpen}
              aria-controls="event-view-menu"
              onClick={() => setViewMenuOpen((open) => !open)}
            >
              <CurrentViewIcon aria-hidden="true" className="size-5" />
              <ChevronDown aria-hidden="true" className="size-3.5" />
            </Button>
            {viewMenuOpen && (
              <div
                id="event-view-menu"
                role="menu"
                aria-label="Choose event view"
                className="absolute bottom-full left-0 z-30 mb-2 min-w-48 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
                onKeyDown={handleViewMenuKeyDown}
              >
                {VIEWS.map(({ id, label, Icon }) => {
                  const selected = activeTagId === id
                  return (
                    <button
                      key={id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      tabIndex={-1}
                      className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                      onClick={() => {
                        onSelectTag(id)
                        setViewMenuOpen(false)
                        viewButtonRef.current?.focus()
                      }}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      <span className="flex-1">{label}</span>
                      {selected && (
                        <Check aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <BottomPill className="min-w-0 flex-1">
            <div
              ref={tagScrollerRef}
              className="flex min-w-0 flex-1 items-center gap-0 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Custom tags"
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-14 shrink-0 rounded-full bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
            aria-label={`Sort events: ${sortDescription}`}
            title={`Sort events: ${sortDescription}`}
            onClick={onToggleSort}
          >
            <SortIcon aria-hidden="true" className="size-6" />
          </Button>
        </div>
      </nav>
    </BottomBar>
  )
}
