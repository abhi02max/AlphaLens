import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import Badge from './Badge'

/**
 * StatCard - Display metric with trend indicator
 */
const StatCard = React.forwardRef(({
  title,
  value,
  change,
  changePercent,
  icon: Icon,
  loading = false,
  className = '',
  ...props
}, ref) => {
  if (loading) {
    return (
      <div
        ref={ref}
        className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse"
      >
        <div className="h-4 w-24 bg-slate-200 rounded mb-4"></div>
        <div className="h-8 w-32 bg-slate-200 rounded"></div>
      </div>
    )
  }

  const isPositive = changePercent >= 0
  const trendIcon = isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />

  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow ${className}`}
      {...props}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
        {Icon && (
          <div className="p-2 bg-slate-50 rounded-lg">
            <Icon size={18} className="text-slate-600" />
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {change !== undefined && (
          <p className="text-xs text-slate-500 mt-1">{change}</p>
        )}
      </div>

      {changePercent !== undefined && (
        <Badge
          variant={isPositive ? 'positive' : 'negative'}
          size="sm"
        >
          {trendIcon}
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </Badge>
      )}
    </div>
  )
})

StatCard.displayName = 'StatCard'

export default StatCard
