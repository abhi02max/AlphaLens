import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, updateLearningMode } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mode, setMode] = useState(user?.learningMode || 'beginner')
  const [saving, setSaving] = useState(false)

  const handleModeChange = async (newMode) => {
    setMode(newMode)
    setSaving(true)
    try {
      await updateLearningMode(newMode)
      toast.success(`Switched to ${newMode} mode`)
    } catch {
      toast.error('Failed to update mode')
      setMode(user?.learningMode)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="card divide-y dark:divide-dark-700">
        <div className="p-6">
          <h2 className="font-semibold mb-1">Account</h2>
          <p className="text-sm text-dark-500">{user?.name} &middot; {user?.email}</p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Appearance</h2>
              <p className="text-sm text-dark-500">Toggle dark mode</p>
            </div>
            <button onClick={toggleTheme} className="btn-ghost p-3 rounded-lg text-xl">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        <div className="p-6">
          <h2 className="font-semibold mb-1">Learning Mode</h2>
          <p className="text-sm text-dark-500 mb-4">Controls how financial data and AI insights are presented</p>
          <div className="flex gap-3">
            <button onClick={() => handleModeChange('beginner')} disabled={saving}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                mode === 'beginner'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-dark-200 dark:border-dark-700'
              }`}>
              <div className="text-lg mb-1">📖</div>
              <div className="font-semibold">Beginner</div>
              <div className="text-xs text-dark-500 mt-1">Simple explanations, basic metrics</div>
            </button>
            <button onClick={() => handleModeChange('pro')} disabled={saving}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                mode === 'pro'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-dark-200 dark:border-dark-700'
              }`}>
              <div className="text-lg mb-1">🚀</div>
              <div className="font-semibold">Pro</div>
              <div className="text-xs text-dark-500 mt-1">Advanced metrics, financial jargon</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}