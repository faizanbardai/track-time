import { cn } from '@/lib/utils'

interface SwipeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Position of the card relative to viewport during swipe transitions.
   * 'left': appears on the left (for next item)
   * 'right': appears on the right (for previous item)
   */
  position: 'left' | 'right'
}

/**
 * Absolutely positioned card for horizontal swipe transitions.
 * Maintains 12px (0.75rem) spacing between cards during swipes.
 * Used for preview panels and off-screen navigation cards.
 */
export const SwipeCard = ({
  position,
  className,
  ...props
}: SwipeCardProps) => {
  const positionClass =
    position === 'left'
      ? 'left-[calc(100%+0.75rem)]'
      : 'right-[calc(100%+0.75rem)]'

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-0 h-full w-full',
        positionClass,
        className,
      )}
      {...props}
    />
  )
}
