import { Info } from 'lucide-react'

export default function MetricCard({ label, value, explanation, icon: Icon }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="text-slate-400 dark:text-slate-500">
                <Icon size={14} />
              </div>
            )}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">{label}</span>
            {explanation && (
              <span className="relative group/tip cursor-help">
                <Info size={12} className="text-slate-400 hover:text-emerald-600 transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 shadow-lg z-10 w-48 text-center pointer-events-none">
                  {explanation}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45"></div>
                </div>
              </span>
            )}
          </div>
        </div>
        <span className="font-bold text-sm text-slate-900 dark:text-white font-mono ml-3">{value}</span>
      </div>
    </div>
  )
}