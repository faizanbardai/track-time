import { cn } from '@/lib/utils'

interface LoaderProps {
  progress?: number
  className?: string
}

export const Loader = ({ progress, className }: LoaderProps) => {
  const determinate = progress !== undefined
  const value = Math.min(100, Math.max(0, progress ?? 0))

  return (
    <div
      className={cn(
        'relative h-0.5 overflow-hidden rounded-full bg-muted',
        className,
      )}
      role={determinate ? 'progressbar' : undefined}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={determinate ? value : undefined}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full bg-primary',
          !determinate && 'loader-indeterminate w-1/3',
        )}
        style={determinate ? { width: `${value}%` } : undefined}
        aria-hidden="true"
      />
    </div>
  )
}
