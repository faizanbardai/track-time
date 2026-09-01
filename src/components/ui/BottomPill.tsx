import type { ComponentProps, KeyboardEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const BottomPill = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn(
      'flex h-14 items-center overflow-hidden rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85',
      className,
    )}
    {...props}
  />
)

interface BottomPillOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface BottomPillSelectorProps<T extends string> {
  ariaLabel: string
  idBase: string
  value: T
  options: BottomPillOption<T>[]
  onValueChange: (value: T) => void
}

export const BottomPillSelector = <T extends string>({
  ariaLabel,
  idBase,
  value,
  options,
  onValueChange,
}: BottomPillSelectorProps<T>) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const activeIndex = options.findIndex((option) => option.value === value)
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight') {
      nextIndex = (activeIndex + 1) % options.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (activeIndex - 1 + options.length) % options.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = options.length - 1
    }

    if (nextIndex === null) return

    event.preventDefault()
    const nextOption = options[nextIndex]
    onValueChange(nextOption.value)
    document.getElementById(`${idBase}-${nextOption.value}-tab`)?.focus()
  }

  return (
    <div className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 w-[calc(100%-1rem)] max-w-sm -translate-x-1/2">
      <BottomPill
        role="tablist"
        aria-label={ariaLabel}
        className="grid grid-cols-2"
      >
        {options.map((option) => {
          const active = option.value === value

          return (
            <Button
              key={option.value}
              id={`${idBase}-${option.value}-tab`}
              type="button"
              role="tab"
              variant="ghost"
              aria-selected={active}
              aria-controls={`${idBase}-${option.value}-panel`}
              tabIndex={active ? 0 : -1}
              className="group h-11 rounded-full px-1 py-0 hover:bg-transparent dark:hover:bg-transparent"
              onClick={() => !active && onValueChange(option.value)}
              onKeyDown={handleKeyDown}
            >
              <span
                className={cn(
                  'inline-flex h-9 w-full items-center justify-center gap-2 rounded-full px-4 transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs group-hover:bg-primary/90'
                    : 'group-hover:bg-accent group-hover:text-accent-foreground dark:group-hover:bg-accent/50',
                )}
              >
                {option.icon}
                {option.label}
              </span>
            </Button>
          )
        })}
      </BottomPill>
    </div>
  )
}
