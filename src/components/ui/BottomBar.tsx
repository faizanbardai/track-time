import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Positions bottom navigation within the viewport and its safe area. */
export const BottomBar = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn(
      'fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 w-[calc(100%-1rem)] -translate-x-1/2',
      className,
    )}
    {...props}
  />
)
