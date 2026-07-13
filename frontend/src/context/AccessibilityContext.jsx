import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AccessibilityContext = createContext(null)
const STORAGE_KEY = 'alphalens-accessibility'

const defaultSettings = {
  largeText: false,
  highContrast: false,
  reduceMotion: false,
  showChartTable: false,
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  } catch {
    return defaultSettings
  }
}

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))

    const root = document.documentElement
    root.classList.toggle('a11y-large-text', settings.largeText)
    root.classList.toggle('a11y-high-contrast', settings.highContrast)
    root.classList.toggle('a11y-reduce-motion', settings.reduceMotion)
  }, [settings])

  const value = useMemo(() => ({
    settings,
    toggleSetting: (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] })),
    resetAccessibility: () => setSettings(defaultSettings),
  }), [settings])

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}
