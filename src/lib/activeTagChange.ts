const ACTIVE_TAG_CHANGE_EVENT = 'track-time:active-tag-change'

type ActiveTagChangeListener = (tagId: string | null) => void

export const dispatchActiveTagChange = (tagId: string | null) => {
  window.dispatchEvent(
    new CustomEvent(ACTIVE_TAG_CHANGE_EVENT, { detail: { tagId } }),
  )
}

export const subscribeToActiveTagChange = (
  listener: ActiveTagChangeListener,
) => {
  const handleChange = (event: Event) => {
    const detail = (event as CustomEvent<{ tagId: string | null }>).detail
    listener(detail?.tagId ?? null)
  }

  window.addEventListener(ACTIVE_TAG_CHANGE_EVENT, handleChange)
  return () => window.removeEventListener(ACTIVE_TAG_CHANGE_EVENT, handleChange)
}
