'use client'

import { type ReactNode, useLayoutEffect, useState } from 'react'
import { useSwipeNavigation } from './useSwipeNavigation'
import { cn } from '@/lib/utils'

interface SwipePagerProps<T extends string> {
  activeKey: T
  keys: readonly T[]
  onSelect: (key: T) => void
  renderPanel: (key: T, active: boolean, isSettling: boolean) => ReactNode
  renderNavigation: (value: T, select: (key: T) => void) => ReactNode
  disabled?: boolean
  keepMounted?: boolean
  tabIdBase?: string
  testId?: string
}

/** Owns panel geometry and gestures; pages supply content and navigation. */
export const SwipePager = <T extends string>({
  activeKey,
  keys,
  onSelect,
  renderPanel,
  renderNavigation,
  disabled = false,
  keepMounted = false,
  tabIdBase,
  testId,
}: SwipePagerProps<T>) => {
  const [displayedKey, setDisplayedKey] = useState(activeKey)
  const { bind, cancel, isSettling, trackRef } = useSwipeNavigation({
    activeKey,
    keys,
    onSelect,
    onSwipeCommit: setDisplayedKey,
    disabled,
  })

  useLayoutEffect(() => {
    setDisplayedKey(activeKey)
  }, [activeKey, disabled])

  const select = (key: T) => {
    cancel()
    setDisplayedKey(key)
    onSelect(key)
  }
  const activeIndex = keys.indexOf(activeKey)

  return (
    <>
      <div
        {...bind}
        onTouchCancel={() => {
          cancel()
          setDisplayedKey(activeKey)
        }}
        data-testid={testId}
        className={cn(
          'min-w-0 touch-pan-y overflow-x-clip',
          isSettling && 'pointer-events-none',
        )}
      >
        <div
          ref={trackRef}
          className="relative min-h-full will-change-transform [--swipe-step:calc(100%+12px)]"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          {keys.map((key, index) => {
            const offset = index - activeIndex
            if (!keepMounted && Math.abs(offset) > 1) return null
            const active = key === activeKey

            return (
              <div
                key={key}
                id={tabIdBase ? `${tabIdBase}-${key}-panel` : undefined}
                role={tabIdBase ? 'tabpanel' : undefined}
                aria-labelledby={
                  tabIdBase ? `${tabIdBase}-${key}-tab` : undefined
                }
                aria-hidden={!active}
                inert={!active}
                className={cn(
                  'w-full min-w-0',
                  active
                    ? 'relative min-h-full'
                    : 'pointer-events-none absolute top-0',
                )}
                style={
                  active
                    ? undefined
                    : {
                        left: `calc(${offset} * var(--swipe-step))`,
                      }
                }
              >
                {renderPanel(key, active, isSettling)}
              </div>
            )
          })}
        </div>
      </div>
      {renderNavigation(displayedKey, select)}
    </>
  )
}
