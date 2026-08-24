'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { listTags, normalizeTagKey, parseTagNames } from '@/helpers/indexedDB'
import { Tag } from '@/types/event'

interface TagPickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}

const serialize = (names: string[]) => names.join(', ')

export const TagPicker = ({ value, onChange, onBlur }: TagPickerProps) => {
  const { dbReady } = useIndexedDB()
  const [tags, setTags] = useState<Tag[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const selectedNames = useMemo(() => parseTagNames(value), [value])
  const selectedKeys = useMemo(
    () => new Set(selectedNames.map(normalizeTagKey)),
    [selectedNames],
  )

  useEffect(() => {
    if (!dbReady) return
    setLoading(true)
    listTags()
      .then((loaded) => setTags(loaded.filter((tag) => !tag.system)))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load tags'),
      )
      .finally(() => setLoading(false))
  }, [dbReady])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const filteredTags = tags.filter((tag) =>
    normalizeTagKey(tag.name).includes(normalizeTagKey(query)),
  )
  const normalizedQuery = query.trim()
  const canCreate =
    Boolean(normalizedQuery) &&
    normalizeTagKey(normalizedQuery) !== normalizeTagKey('All') &&
    !selectedKeys.has(normalizeTagKey(normalizedQuery)) &&
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

  const addQuery = () => {
    if (
      !normalizedQuery ||
      normalizeTagKey(normalizedQuery) === normalizeTagKey('All')
    )
      return
    const existing = tags.find(
      (tag) => normalizeTagKey(tag.name) === normalizeTagKey(normalizedQuery),
    )
    if (!selectedKeys.has(normalizeTagKey(normalizedQuery))) {
      setSelected([...selectedNames, existing?.name ?? normalizedQuery])
    }
    setQuery('')
  }

  return (
    <div ref={pickerRef} className="grid gap-2" onBlur={onBlur}>
      {selectedNames.length > 0 && (
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
      )}

      <div className="relative">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
            }
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              addQuery()
            }
          }}
          placeholder="Search or create a tag"
          aria-label="Search or create tags"
          aria-expanded={open}
          aria-controls="tag-picker-options"
          role="combobox"
        />

        {open && (
          <div
            id="tag-picker-options"
            role="listbox"
            className="absolute top-full z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border bg-popover p-2 shadow-md"
          >
            {loading || !dbReady ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                Loading tags...
              </p>
            ) : (
              <>
                {filteredTags.map((tag) => (
                  <label
                    key={tag.id}
                    htmlFor={`tag-${tag.id}`}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedKeys.has(normalizeTagKey(tag.name))}
                      onCheckedChange={() => toggleTag(tag.name)}
                    />
                    {tag.name}
                  </label>
                ))}
                {canCreate && (
                  <button
                    type="button"
                    className="w-full rounded-sm px-2 py-1.5 text-left text-sm font-medium hover:bg-accent"
                    onClick={addQuery}
                  >
                    Create “{normalizedQuery}”
                  </button>
                )}
                {filteredTags.length === 0 && !canCreate && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    {query ? 'No matching tags' : 'No tags yet'}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
