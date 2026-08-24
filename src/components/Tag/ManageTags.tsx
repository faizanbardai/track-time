'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical, X } from 'lucide-react'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createTag,
  deleteTag,
  listTagsWithUsage,
  renameTag,
  reorderTags,
} from '@/helpers/indexedDB'
import { TagWithUsage } from '@/types/event'

interface SortableTagProps {
  tag: TagWithUsage
  editing: boolean
  value: string
  busy: boolean
  onChange: (value: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}

const SortableTag = ({
  tag,
  editing,
  value,
  busy,
  onChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: SortableTagProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: tag.id })

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex w-full touch-none items-center gap-1 rounded-full border bg-tag px-2 py-1 text-sm font-medium text-tag-foreground shadow-xs"
      {...attributes}
      {...listeners}
    >
      {editing ? (
        <Input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onSave()
            } else if (event.key === 'Escape') {
              event.preventDefault()
              onCancel()
            }
          }}
          aria-label={`Rename ${tag.name}`}
          className="h-7 min-w-20 flex-1 rounded-full border-0 bg-transparent px-2 py-0 shadow-none focus-visible:ring-1"
          disabled={busy}
        />
      ) : (
        <button
          type="button"
          className="min-w-0 flex-1 truncate rounded-full px-2 py-1 text-left outline-none hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(event) => {
            event.stopPropagation()
            onEdit()
          }}
        >
          {tag.name}
        </button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          if (editing) onSave()
          else onDelete()
        }}
        disabled={busy}
        aria-label={editing ? `Save ${tag.name}` : `Delete ${tag.name}`}
        title={editing ? 'Save tag' : 'Delete tag'}
      >
        {editing ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
      </Button>
      <GripVertical
        aria-hidden="true"
        className="size-4 text-muted-foreground"
      />
    </div>
  )
}

export const ManageTags = () => {
  const { dbReady } = useIndexedDB()
  const [tags, setTags] = useState<TagWithUsage[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const loadTags = useCallback(async () => {
    setLoading(true)
    try {
      const loaded = (await listTagsWithUsage()).filter((tag) => !tag.system)
      setTags(loaded)
      setNames(Object.fromEntries(loaded.map((tag) => [tag.id, tag.name])))
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

  useEffect(() => {
    if (!editingId) return
    const cancelOutside = (event: PointerEvent) => {
      if (!listRef.current?.contains(event.target as Node)) setEditingId(null)
    }
    document.addEventListener('pointerdown', cancelOutside)
    return () => document.removeEventListener('pointerdown', cancelOutside)
  }, [editingId])

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
    if (name.trim() === tag.name) {
      setEditingId(null)
      return
    }
    setSavingId(tag.id)
    try {
      await renameTag(tag.id, name)
      setEditingId(null)
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

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIndex = tags.findIndex((tag) => tag.id === active.id)
    const newIndex = tags.findIndex((tag) => tag.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const ordered = arrayMove(tags, oldIndex, newIndex)
    setTags(ordered)
    try {
      await reorderTags(ordered.map((tag) => tag.id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reorder tags')
      await loadTags()
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="New tag name"
          aria-label="New tag name"
        />
        <Button type="submit" disabled={!newName.trim() || savingId === 'new'}>
          {savingId === 'new' ? 'Adding...' : 'Add tag'}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading tags...</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No custom tags yet.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tags.map((tag) => tag.id)}
            strategy={verticalListSortingStrategy}
          >
            <div ref={listRef} className="grid gap-2">
              {tags.map((tag) => (
                <SortableTag
                  key={tag.id}
                  tag={tag}
                  editing={editingId === tag.id}
                  value={names[tag.id] ?? ''}
                  busy={savingId === tag.id}
                  onChange={(value) =>
                    setNames((current) => ({ ...current, [tag.id]: value }))
                  }
                  onEdit={() => setEditingId(tag.id)}
                  onSave={() => void handleRename(tag)}
                  onCancel={() => {
                    setNames((current) => ({
                      ...current,
                      [tag.id]: tag.name,
                    }))
                    setEditingId(null)
                  }}
                  onDelete={() => void handleDelete(tag)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
