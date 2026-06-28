export default function MetricCard({ label, value, explanation }) {
  return (
    <div className="card p-3 group">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm text-dark-500 truncate">{label}</span>
            {explanation && (
              <span className="relative group/tip cursor-help">
                <span className="text-xs text-dark-400">ⓘ</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-dark-900 dark:bg-dark-100 text-white dark:text-dark-900 text-xs whitespace-nowrap opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all shadow-lg z-10 w-48 text-center">
                  {explanation}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-dark-900 dark:bg-dark-100 rotate-45"></div>
                </div>
              </span>
            )}
          </div>
        </div>
        <span className="font-semibold text-sm ml-2">{value}</span>
      </div>
    </div>
  )
}