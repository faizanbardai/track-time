'use client'

import { useEffect, useMemo, useState } from 'react'
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
  const [error, setError] = useState<string | null>(null)
  const selectedNames = useMemo(() => parseTagNames(value), [value])
  const selectedKeys = useMemo(
    () => new Set(selectedNames.map(normalizeTagKey)),
    [selectedNames],
  )

  useEffect(() => {
    if (!dbReady) return
    listTags()
      .then((loaded) => setTags(loaded.filter((tag) => !tag.system)))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load tags'),
      )
  }, [dbReady])

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
    <div className="grid gap-3" onBlur={onBlur}>
      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedNames.map((name) => (
            <span
              key={normalizeTagKey(name)}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
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

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            addQuery()
          }
        }}
        placeholder="Search or create a tag"
        aria-label="Search or create tags"
      />

      <div className="max-h-40 overflow-y-auto rounded-md border p-2">
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
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add a new tag.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
