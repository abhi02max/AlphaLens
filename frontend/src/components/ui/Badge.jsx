import React from 'react'
import { cn } from '../../utils/helpers'

/**
 * Badge component for labels and status indicators
 */
const Badge = React.forwardRef(({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    positive: 'bg-green-50 text-green-700',
    negative: 'bg-red-50 text-red-700',
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs font-medium rounded',
    md: 'px-3 py-1.5 text-sm font-semibold rounded-lg',
    lg: 'px-4 py-2 text-base font-semibold rounded-lg',
  }

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 font-semibold',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'

export default Badge
