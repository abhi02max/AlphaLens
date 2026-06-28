import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { path: '/', label: 'Home', icon: '◉' },
    { path: '/search', label: 'Search', icon: '◇' },
    ...(isAuthenticated ? [{ path: '/watchlist', label: 'Watchlist', icon: '□' }] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-dark-950/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-bold gradient-text">AlphaLens</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === item.path
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-dark-600 hover:bg-dark-50 dark:text-dark-400 dark:hover:bg-dark-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost p-2 rounded-lg text-lg">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/settings" className="btn-ghost text-sm px-3 py-1.5 rounded-lg">{user?.name}</Link>
                <button onClick={() => { logout(); navigate('/') }} className="btn-ghost text-sm px-3 py-1.5 rounded-lg">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm px-4 py-1.5 rounded-lg">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t py-4 text-center text-sm text-dark-500 dark:text-dark-400">
        AlphaLens &mdash; AI Financial Intelligence
      </footer>
    </div>
  )
}