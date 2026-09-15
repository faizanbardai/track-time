'use client'

import CreateOrUpdateEvent from '@/components/Event/CreateOrUpdateEvent'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useIndexedDB } from '@/components/providers/indexedDB'
import { ALL_TAG_ID, UPCOMING_TAG_ID, db } from '@/helpers/indexedDB'

const NewEventForm = ({ tagId }: { tagId: string | null }) => {
  const { dbReady, dbError } = useIndexedDB()
  const [defaultTags, setDefaultTags] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const customTagId =
    tagId && tagId !== ALL_TAG_ID && tagId !== UPCOMING_TAG_ID ? tagId : null

  useEffect(() => {
    if (!customTagId || !dbReady) return
    let cancelled = false

    db.tags
      .get(customTagId)
      .then((tag) => {
        if (!cancelled) setDefaultTags(tag && !tag.system ? tag.name : '')
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load the selected tag')
      })

    return () => {
      cancelled = true
    }
  }, [customTagId, dbReady])

  if (customTagId && (error || dbError)) {
    return <p role="alert">{error || dbError}</p>
  }
  if (customTagId && defaultTags === null) {
    return <div aria-busy="true">Loading...</div>
  }

  return <CreateOrUpdateEvent event={null} defaultTags={defaultTags ?? ''} />
}

const EventPageContent = () => {
  const tagId = useSearchParams().get('tag')
  return <NewEventForm key={tagId} tagId={tagId} />
}

const EventPage = () => (
  <Suspense fallback={<div aria-busy="true">Loading...</div>}>
    <EventPageContent />
  </Suspense>
)

export default EventPage
