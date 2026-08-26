import { describe, expect, it } from 'vitest'
import { shouldRefreshSwipePreview } from './swipePreview'

describe('shouldRefreshSwipePreview', () => {
  it('keeps the preview stable while the swipe is settling', () => {
    expect(shouldRefreshSwipePreview(true)).toBe(false)
  })

  it('refreshes the preview when the pager is idle', () => {
    expect(shouldRefreshSwipePreview(false)).toBe(true)
  })
})
