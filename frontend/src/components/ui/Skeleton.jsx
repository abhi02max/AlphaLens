import React from 'react'
import { cn } from '../../utils/helpers'

/**
 * Skeleton Loader - Animated placeholder for loading states
 * Used while data is being fetched
 */
const Skeleton = React.forwardRef(({
  className = '',
  variant = 'default',
  count = 1,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200',
    text: 'h-4 rounded',
    card: 'h-32 rounded-xl',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 rounded-lg',
  }

  const skeletons = Array.from({ length: count })

  return (
    <>
      {skeletons.map((_, idx) => (
        <div
          key={idx}
          ref={idx === 0 ? ref : null}
          className={cn(
            'animate-pulse',
            variants[variant],
            className
          )}
          {...props}
        />
      ))}
    </>
  )
})

Skeleton.displayName = 'Skeleton'

/**
 * Card Skeleton - Loading state for cards
 */
const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

/**
 * Input Skeleton - Loading state for inputs
 */
const InputSkeleton = () => {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  )
}

/**
 * Form Skeleton - Loading state for forms
 */
const FormSkeleton = ({ inputs = 3 }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
      {Array.from({ length: inputs }).map((_, idx) => (
        <InputSkeleton key={idx} />
      ))}
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  )
}

/**
 * Table Skeleton - Loading state for tables
 */
const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className="h-10 flex-1 rounded"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export { Skeleton, CardSkeleton, InputSkeleton, FormSkeleton, TableSkeleton }
export default Skeleton
