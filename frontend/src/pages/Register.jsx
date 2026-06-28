import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', learningMode: 'beginner' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { toast.error('Please fill in all fields'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, form.learningMode)
      toast.success('Account created!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-bold gradient-text">AlphaLens</span>
          </Link>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">Start your learning journey</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input" placeholder="Your name" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="input" placeholder="At least 6 characters" required />
          </div>
          <div>
            <label className="label">Learning Mode</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setForm({...form, learningMode: 'beginner'})}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.learningMode === 'beginner'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-dark-200 dark:border-dark-700 text-dark-600 dark:text-dark-400'
                }`}>
                📖 Beginner
              </button>
              <button type="button" onClick={() => setForm({...form, learningMode: 'pro'})}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.learningMode === 'pro'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-dark-200 dark:border-dark-700 text-dark-600 dark:text-dark-400'
                }`}>
                🚀 Pro
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-dark-500">
            Already have an account? <Link to="/login" className="link">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}