import React from 'react'
import { cn } from '../../utils/helpers'

/**
 * Enterprise-grade Input component
 * Supports different types, sizes, and validation states
 */
const Input = React.forwardRef(({
  label,
  error,
  hint,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-4 py-3 text-lg',
  }

  const baseStyles = cn(
    'w-full border-2 border-slate-200 rounded-lg transition-all duration-200',
    'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
    'placeholder:text-slate-400 text-slate-900',
    'disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400',
    'bg-white',
    error && 'border-red-500 focus:border-red-500 focus:ring-red-100',
    sizes[size]
  )

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
          {props.required && <span className="text-red-500">*</span>}
        </label>
      )}

      <input
        ref={ref}
        className={cn(baseStyles, className)}
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
      />

      {error && (
        <p id={`${props.id}-error`} className="text-sm text-red-600 mt-1.5" role="alert">
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-sm text-slate-500 mt-1.5">{hint}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
