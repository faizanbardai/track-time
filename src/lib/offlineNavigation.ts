export const isBrowserOffline = () =>
  typeof navigator !== 'undefined' && !navigator.onLine

export const navigateWithOfflineFallback = (
  path: string,
  navigateClientSide: () => void,
) => {
  if (isBrowserOffline()) {
    window.location.assign(path)
    return
  }

  navigateClientSide()
}
