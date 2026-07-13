import React from 'react'
import { cn } from '../../utils/helpers'

/**
 * Card component for consistent spacing and styling
 */
const Card = React.forwardRef(({
  className = '',
  variant = 'default',
  children,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-white border border-slate-200 shadow-sm',
    elevated: 'bg-white border border-slate-100 shadow-md',
    ghost: 'bg-transparent border border-slate-200',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl transition-all duration-200',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

/**
 * Card Header
 */
const CardHeader = React.forwardRef(({
  className = '',
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('px-6 py-4 border-b border-slate-100', className)}
    {...props}
  >
    {children}
  </div>
))

CardHeader.displayName = 'CardHeader'

/**
 * Card Body
 */
const CardBody = React.forwardRef(({
  className = '',
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('px-6 py-4', className)}
    {...props}
  >
    {children}
  </div>
))

CardBody.displayName = 'CardBody'

/**
 * Card Footer
 */
const CardFooter = React.forwardRef(({
  className = '',
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex gap-3 justify-end', className)}
    {...props}
  >
    {children}
  </div>
))

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardBody, CardFooter }
export default Card
