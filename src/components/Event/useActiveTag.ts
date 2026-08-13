import { ALL_TAG_ID } from '@/helpers/indexedDB'
import { Tag } from '@/types/event'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

const TAG_QUERY_PARAM = 'tag'
const ACTIVE_TAG_STORAGE_KEY = 'track-time:active-tag-id'

export const useActiveTag = (tags: Tag[]) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTagId, setActiveTagId] = useState(ALL_TAG_ID)
  const [selectionReady, setSelectionReady] = useState(false)

  useEffect(() => {
    if (tags.length === 0) return

    const urlTagId = searchParams.get(TAG_QUERY_PARAM)
    const savedTagId = window.localStorage.getItem(ACTIVE_TAG_STORAGE_KEY)
    const requestedTagId = urlTagId ?? savedTagId ?? ALL_TAG_ID
    const nextTagId = tags.some((tag) => tag.id === requestedTagId)
      ? requestedTagId
      : ALL_TAG_ID

    setActiveTagId(nextTagId)
    setSelectionReady(true)

    if (nextTagId === ALL_TAG_ID) {
      window.localStorage.removeItem(ACTIVE_TAG_STORAGE_KEY)
    } else {
      window.localStorage.setItem(ACTIVE_TAG_STORAGE_KEY, nextTagId)
    }

    if (urlTagId !== null && urlTagId !== nextTagId) {
      const nextSearchParams = new URLSearchParams(searchParams.toString())
      nextSearchParams.delete(TAG_QUERY_PARAM)
      const query = nextSearchParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    } else if (urlTagId === null && nextTagId !== ALL_TAG_ID) {
      const nextSearchParams = new URLSearchParams(searchParams.toString())
      nextSearchParams.set(TAG_QUERY_PARAM, nextTagId)
      router.replace(`${pathname}?${nextSearchParams.toString()}`, {
        scroll: false,
      })
    }
  }, [pathname, router, searchParams, tags])

  const selectTag = useCallback(
    (tagId: string) => {
      setActiveTagId(tagId)

      if (tagId === ALL_TAG_ID) {
        window.localStorage.removeItem(ACTIVE_TAG_STORAGE_KEY)
      } else {
        window.localStorage.setItem(ACTIVE_TAG_STORAGE_KEY, tagId)
      }

      const nextSearchParams = new URLSearchParams(searchParams.toString())
      if (tagId === ALL_TAG_ID) {
        nextSearchParams.delete(TAG_QUERY_PARAM)
      } else {
        nextSearchParams.set(TAG_QUERY_PARAM, tagId)
      }

      const query = nextSearchParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams],
  )

  return {
    activeTagId,
    selectionReady,
    selectTag,
  }
}
