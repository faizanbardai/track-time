const ACTIVE_TAG_CHANGE_EVENT = 'track-time:active-tag-change'

type ActiveTagChangeDetail = {
  tagId: string | null
  tagName?: string
}

type ActiveTagChangeListener = (tagId: string | null, tagName?: string) => void

export const dispatchActiveTagChange = (
  tagId: string | null,
  tagName?: string,
) => {
  window.dispatchEvent(
    new CustomEvent<ActiveTagChangeDetail>(ACTIVE_TAG_CHANGE_EVENT, {
      detail: { tagId, tagName },
    }),
  )
}

export const subscribeToActiveTagChange = (
  listener: ActiveTagChangeListener,
) => {
  const handleChange = (event: Event) => {
    const detail = (event as CustomEvent<ActiveTagChangeDetail>).detail
    listener(detail?.tagId ?? null, detail?.tagName)
  }

  window.addEventListener(ACTIVE_TAG_CHANGE_EVENT, handleChange)
  return () => window.removeEventListener(ACTIVE_TAG_CHANGE_EVENT, handleChange)
}
