import { useState, useEffect } from 'react'
import { UserProfile } from '@clerk/clerk-react'
import { useTheme } from '../context/ThemeContext'
import { userApi } from '../services/api'
import toast from 'react-hot-toast'
import { Settings as SettingsIcon, Palette, BookOpen, Rocket, Sun, Moon } from 'lucide-react'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const [mode, setMode] = useState('beginner')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await userApi.getPreferences()
        if (res.data?.data?.learningMode) {
          setMode(res.data.data.learningMode)
        }
      } catch (err) {
        console.error('Failed to load preferences', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPrefs()
  }, [])

  const handleModeChange = async (newMode) => {
    if (newMode === mode) return
    const prevMode = mode
    setMode(newMode)
    setSaving(true)
    try {
      await userApi.updateLearningMode(newMode)
      toast.success(`Switched to ${newMode} mode`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update mode')
      setMode(prevMode)
    } finally {
      setSaving(false)
    }
  }

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

          {/* Learning Mode */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen size={18} className="text-emerald-500" />
                Learning Mode
              </h2>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500 mb-4">Controls how AI insights are presented.</p>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                  <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => handleModeChange('beginner')}
                    disabled={saving}
                    className={`w-full p-4 rounded-lg border text-left transition-all flex items-start gap-3 ${
                      mode === 'beginner'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`mt-0.5 ${mode === 'beginner' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white mb-0.5">Beginner</div>
                      <div className="text-xs text-slate-500">Simplified, jargon-free</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleModeChange('pro')}
                    disabled={saving}
                    className={`w-full p-4 rounded-lg border text-left transition-all flex items-start gap-3 ${
                      mode === 'pro'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`mt-0.5 ${mode === 'pro' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <Rocket size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white mb-0.5">Pro</div>
                      <div className="text-xs text-slate-500">Advanced metrics & TA</div>
                    </div>
                  </button>
                </div>
              )}
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