// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoadingProvider, GlobalLoader } from './loading'
import { ToastProvider, useToast } from './toast'

const ToastTrigger = ({ keepLoading = false }: { keepLoading?: boolean }) => {
  const { showToast } = useToast()

  return (
    <button
      type="button"
      onClick={() =>
        showToast(
          'Event deleted',
          {
            label: 'Undo',
            keepLoading,
            onClick: async () => undefined,
          },
          5000,
        )
      }
    >
      Show toast
    </button>
  )
}

const renderToast = (keepLoading = false) =>
  render(
    <LoadingProvider>
      <ToastProvider>
        <GlobalLoader />
        <ToastTrigger keepLoading={keepLoading} />
      </ToastProvider>
    </LoadingProvider>,
  )

const isGlobalLoading = () =>
  document.querySelector('[aria-busy="true"]') !== null

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('keeps the global loader active for the actionable toast duration', () => {
    renderToast(true)

    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }))
    expect(isGlobalLoading()).toBe(true)

    act(() => {
      vi.advanceTimersByTime(4999)
    })
    expect(isGlobalLoading()).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(isGlobalLoading()).toBe(false)
  })

  it('does not activate the global loader for an opt-out action', () => {
    renderToast()

    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }))
    expect(isGlobalLoading()).toBe(false)
  })

  it('keeps loading until an opted-in action completes', async () => {
    let resolveAction: (() => void) | undefined
    const action = new Promise<void>((resolve) => {
      resolveAction = resolve
    })

    const ActionTrigger = () => {
      const { showToast } = useToast()
      return (
        <button
          type="button"
          onClick={() =>
            showToast('Event deleted', {
              label: 'Undo',
              keepLoading: true,
              onClick: () => action,
            })
          }
        >
          Show undo toast
        </button>
      )
    }

    render(
      <LoadingProvider>
        <ToastProvider>
          <GlobalLoader />
          <ActionTrigger />
        </ToastProvider>
      </LoadingProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Show undo toast' }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(isGlobalLoading()).toBe(true)

    await act(async () => {
      resolveAction?.()
    })
    expect(isGlobalLoading()).toBe(false)
  })
})
