import { UserProfile } from '@clerk/clerk-react'
import { useTheme } from '../context/ThemeContext'
import { Settings as SettingsIcon, Palette, Gauge, Sun, Moon } from 'lucide-react'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-1">
          <SettingsIcon size={26} className="text-emerald-500" />
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your account and app preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column - Custom App Settings */}
        <div className="md:col-span-1 space-y-6">
          {/* Appearance */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette size={18} className="text-emerald-500" />
                Appearance
              </h2>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-slate-900 dark:text-white">Theme</div>
                  <div className="text-xs text-slate-500">Toggle dark mode</div>
                </div>
                {/* Toggle Switch */}
                <button
                  onClick={toggleTheme}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                    theme === 'dark' ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                  }`}>
                    {theme === 'dark' ? <Moon size={10} className="text-emerald-600" /> : <Sun size={10} className="text-amber-500" />}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Workspace Profile */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Gauge size={18} className="text-emerald-500" />
                Workspace Profile
              </h2>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/20 p-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <Gauge size={18} />
                  <span className="font-bold text-sm uppercase tracking-wide">Legendary Pro</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mt-2">
                  Full market-desk presentation with technical studies, valuation context, catalyst intelligence, simulation risk, and execution triggers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Clerk User Profile */}
        <div className="md:col-span-2">
          {/* We embed Clerk's UserProfile component directly. 
              The internal routing of UserProfile allows users to manage emails, passwords, connected accounts, etc. 
              We use a custom wrapper to match our design. */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex justify-center p-6">
            <UserProfile 
              appearance={{
                elements: {
                  rootBox: "w-full shadow-none",
                  cardBox: "w-full shadow-none rounded-none border-none",
                  navbar: "hidden md:flex",
                }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
