import { Link } from 'react-router-dom'
import { WalletCards } from 'lucide-react'

export default function WalletStackMark({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="WalletStack home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-mint-300 shadow-sm dark:bg-white dark:text-slate-950">
        <WalletCards size={19} strokeWidth={2.4} />
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-mint-400 dark:border-slate-950" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-extrabold tracking-[-0.03em] text-slate-950 dark:text-white">WalletStack</span>
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Money, in focus</span>
        </span>
      )}
    </Link>
  )
}
