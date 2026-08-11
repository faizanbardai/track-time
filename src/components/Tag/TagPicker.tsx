'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { listTags, parseTagNames } from '@/helpers/indexedDB'
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
    () => new Set(selectedNames.map((name) => name.toLocaleLowerCase())),
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
    tag.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  )
  const normalizedQuery = query.trim()
  const canCreate =
    Boolean(normalizedQuery) &&
    normalizedQuery.toLocaleLowerCase() !== 'all' &&
    !selectedKeys.has(normalizedQuery.toLocaleLowerCase()) &&
    !tags.some(
      (tag) =>
        tag.name.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase(),
    )

  const setSelected = (names: string[]) => onChange(serialize(names))

  const toggleTag = (name: string) => {
    const key = name.toLocaleLowerCase()
    if (selectedKeys.has(key)) {
      setSelected(
        selectedNames.filter(
          (selected) => selected.toLocaleLowerCase() !== key,
        ),
      )
      return
    }
    setSelected([...selectedNames, name])
  }

  const addQuery = () => {
    if (!normalizedQuery || normalizedQuery.toLocaleLowerCase() === 'all')
      return
    const existing = tags.find(
      (tag) =>
        tag.name.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase(),
    )
    if (!selectedKeys.has(normalizedQuery.toLocaleLowerCase())) {
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
              key={name.toLocaleLowerCase()}
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
              checked={selectedKeys.has(tag.name.toLocaleLowerCase())}
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
