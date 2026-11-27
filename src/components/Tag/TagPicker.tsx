'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useIndexedDB } from '@/components/providers/indexedDB'
import {
  createTag,
  listTags,
  normalizeTagKey,
  parseTagNames,
} from '@/helpers/indexedDB'
import { MAX_TAG_NAME_LENGTH } from '@/constants/validation'
import { Tag } from '@/types/event'
import { useLoadingActions } from '@/components/providers/loading'

interface TagPickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}

const serialize = (names: string[]) => names.join(', ')

export const TagPicker = ({ value, onChange, onBlur }: TagPickerProps) => {
  const { dbReady, dbError } = useIndexedDB()
  const { startLoading, stopLoading } = useLoadingActions()
  const [tags, setTags] = useState<Tag[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const selectedNames = useMemo(() => parseTagNames(value), [value])
  const selectedKeys = useMemo(
    () => new Set(selectedNames.map(normalizeTagKey)),
    [selectedNames],
  )

  useEffect(() => {
    if (dbError) {
      setError(`Local storage is unavailable: ${dbError}`)
      setLoading(false)
      return
    }
    if (!dbReady) return
    setLoading(true)
    startLoading()
    listTags()
      .then((loaded) => setTags(loaded.filter((tag) => !tag.system)))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load tags'),
      )
      .finally(() => setLoading(false))
      .finally(stopLoading)
  }, [dbError, dbReady, startLoading, stopLoading])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    const viewport = window.visualViewport
    if (!open || !dialog || !viewport) return

    const media = window.matchMedia('(max-width: 639px)')
    const updatePosition = () => {
      if (!media.matches) {
        dialog.style.removeProperty('bottom')
        dialog.style.removeProperty('max-height')
        return
      }
      // visualViewport tracks the area above Android's on-screen keyboard,
      // including browsers that keep the layout viewport at full height.
      dialog.style.bottom = `${Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height)}px`
      dialog.style.maxHeight = `${Math.min(viewport.height * 0.85, 704)}px`
    }

    updatePosition()
    viewport.addEventListener('resize', updatePosition)
    viewport.addEventListener('scroll', updatePosition)
    window.addEventListener('resize', updatePosition)
    return () => {
      viewport.removeEventListener('resize', updatePosition)
      viewport.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
      dialog.style.removeProperty('bottom')
      dialog.style.removeProperty('max-height')
    }
  }, [open])

  const filteredTags = tags.filter((tag) =>
    normalizeTagKey(tag.name).includes(normalizeTagKey(query.trim())),
  )
  const normalizedQuery = query.trim()
  const canCreate =
    Boolean(normalizedQuery) &&
    !normalizedQuery.includes(',') &&
    normalizeTagKey(normalizedQuery) !== normalizeTagKey('All') &&
    !tags.some(
      (tag) => normalizeTagKey(tag.name) === normalizeTagKey(normalizedQuery),
    )

  const setSelected = (names: string[]) => onChange(serialize(names))

  const toggleTag = (name: string) => {
    const key = normalizeTagKey(name)
    if (selectedKeys.has(key)) {
      setSelected(
        selectedNames.filter((selected) => normalizeTagKey(selected) !== key),
      )
      return
    }
    setSelected([...selectedNames, name])
  }

  const handleCreate = async () => {
    if (!canCreate || creating) return
    if (normalizedQuery.length > MAX_TAG_NAME_LENGTH) {
      setError(`Tag names cannot exceed ${MAX_TAG_NAME_LENGTH} characters`)
      return
    }
    setError(null)
    setCreating(true)
    startLoading()
    try {
      const tag = await createTag(normalizedQuery)
      setTags((current) =>
        current.some((existing) => existing.id === tag.id)
          ? current
          : [...current, tag],
      )
      setSelected([...selectedNames, tag.name])
      setQuery('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tag')
    } finally {
      setCreating(false)
      stopLoading()
    }
  }

  return (
    <div className="grid gap-2" onBlur={onBlur}>
      {selectedNames.length > 0 ? (
        <div className="flex max-h-16 flex-wrap gap-1 overflow-y-auto">
          {selectedNames.map((name) => (
            <span
              key={normalizeTagKey(name)}
              className="inline-flex items-center gap-1 rounded-full bg-tag px-2 py-0.5 text-sm font-medium text-tag-foreground"
            >
              {name}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-background/80"
                onClick={() => toggleTag(name)}
                aria-label={`Remove ${name}`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No tags selected</p>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
        aria-haspopup="dialog"
      >
        <Plus />
        Choose tags
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="tag-picker-title"
        aria-describedby="tag-picker-description"
        className="fixed inset-x-0 bottom-0 top-auto m-0 open:flex max-h-[85dvh] w-full max-w-none flex-col overflow-hidden rounded-t-2xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50 sm:inset-y-0 sm:bottom-auto sm:m-auto sm:max-h-[min(80dvh,42rem)] sm:w-[min(32rem,calc(100%-2rem))] sm:rounded-xl"
        onCancel={(event) => {
          event.preventDefault()
          setOpen(false)
        }}
        onClose={() => setOpen(false)}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b p-4">
          <div className="grid gap-1">
            <h2 id="tag-picker-title" className="text-lg font-semibold">
              Choose tags
            </h2>
            <p
              id="tag-picker-description"
              className="text-sm text-muted-foreground"
            >
              Select tags for this event, or create a new tag to add to your
              list.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close tag selection"
            onClick={() => setOpen(false)}
          >
            <X />
          </Button>
        </div>

        <div className="shrink-0 p-4 pb-2">
          <Input
            value={query}
            maxLength={MAX_TAG_NAME_LENGTH}
            aria-label="Search tags"
            aria-describedby={error ? 'tag-picker-error' : undefined}
            placeholder="Search tags"
            onChange={(event) => {
              setQuery(event.target.value)
              setError(null)
            }}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3">
          {loading || !dbReady ? (
            <p className="py-3 text-sm text-muted-foreground">Loading tags…</p>
          ) : filteredTags.length > 0 ? (
            <div className="grid gap-1">
              {filteredTags.map((tag) => (
                <label
                  key={tag.id}
                  htmlFor={`tag-picker-${tag.id}`}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  <Checkbox
                    id={`tag-picker-${tag.id}`}
                    checked={selectedKeys.has(normalizeTagKey(tag.name))}
                    onCheckedChange={() => toggleTag(tag.name)}
                  />
                  <span className="flex-1">{tag.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="py-3 text-sm text-muted-foreground">
              {normalizedQuery ? 'No matching tags' : 'No tags yet'}
            </p>
          )}
        </div>

        <div className="grid shrink-0 gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {canCreate && (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={handleCreate}
              disabled={creating || loading}
            >
              <Plus />
              {creating
                ? 'Creating tag…'
                : `Create and add “${normalizedQuery}”`}
            </Button>
          )}
          {error && (
            <p
              id="tag-picker-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <Button
            type="button"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Done
            {selectedNames.length > 0
              ? ` · ${selectedNames.length} selected`
              : ''}
          </Button>
        </div>
      </dialog>
    </div>
  )
}
