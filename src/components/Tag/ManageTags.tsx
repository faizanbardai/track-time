'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  createTag,
  deleteTag,
  listTagsWithUsage,
  renameTag,
} from '@/helpers/indexedDB'
import { TagWithUsage } from '@/types/event'

export const ManageTags = () => {
  const { dbReady } = useIndexedDB()
  const [tags, setTags] = useState<TagWithUsage[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadTags = useCallback(async () => {
    setLoading(true)
    try {
      const loaded = await listTagsWithUsage()
      const editable = loaded.filter((tag) => !tag.system)
      setTags(editable)
      setNames(Object.fromEntries(editable.map((tag) => [tag.id, tag.name])))
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tags')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (dbReady) void loadTags()
  }, [dbReady, loadTags])

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!newName.trim()) return
    setSavingId('new')
    try {
      await createTag(newName)
      setNewName('')
      await loadTags()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tag')
    } finally {
      setSavingId(null)
    }
  }

  const handleRename = async (tag: TagWithUsage) => {
    const name = names[tag.id] ?? ''
    if (name.trim() === tag.name) return
    setSavingId(tag.id)
    try {
      await renameTag(tag.id, name)
      await loadTags()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to rename tag')
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (tag: TagWithUsage) => {
    const eventLabel = `${tag.eventCount} ${tag.eventCount === 1 ? 'event' : 'events'}`
    const confirmed = window.confirm(
      `Delete “${tag.name}”? It will be removed from ${eventLabel}. The events themselves will not be deleted.`,
    )
    if (!confirmed) return

    setSavingId(tag.id)
    try {
      await deleteTag(tag.id)
      await loadTags()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage tags</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="New tag name"
            aria-label="New tag name"
          />
          <Button
            type="submit"
            disabled={!newName.trim() || savingId === 'new'}
          >
            {savingId === 'new' ? 'Adding…' : 'Add tag'}
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading tags…</p>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No custom tags yet.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {tags.map((tag) => {
              const busy = savingId === tag.id
              return (
                <div
                  key={tag.id}
                  className="grid gap-3 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <div>
                    <Input
                      value={names[tag.id] ?? ''}
                      onChange={(event) =>
                        setNames((current) => ({
                          ...current,
                          [tag.id]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleRename(tag)
                        }
                      }}
                      aria-label={`Rename ${tag.name}`}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Used by {tag.eventCount}{' '}
                      {tag.eventCount === 1 ? 'event' : 'events'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleRename(tag)}
                    disabled={busy || !(names[tag.id] ?? '').trim()}
                  >
                    {busy ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void handleDelete(tag)}
                    disabled={busy}
                  >
                    Delete
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
