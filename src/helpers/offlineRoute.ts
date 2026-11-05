export const getOfflineEventId = (pathname: string) => {
  const match = pathname.match(/^\/event\/([^/]+)\/?$/)
  if (!match) return null

  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}
