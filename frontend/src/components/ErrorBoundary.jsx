import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

/**
 * Error Boundary component to catch and display React component errors
 * Prevents entire app from crashing due to component errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log to error tracking service (Sentry, etc.)
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Send to backend/monitoring service
    if (typeof window !== 'undefined' && window.__reportError) {
      window.__reportError({
        type: 'component-error',
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-10 max-w-md w-full text-center animate-fade-in-up">
            {/* Error Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertCircle className="text-white" size={32} />
            </div>

            <h1 className="text-2xl font-bold font-display text-surface-900 dark:text-white mb-3">
              Something went wrong
            </h1>

            <p className="text-surface-600 dark:text-surface-400 mb-6 leading-relaxed">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded-xl p-4 mb-6 max-h-32 overflow-auto text-left">
                <p className="text-xs font-mono text-red-800 dark:text-red-300 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 btn-primary py-3 rounded-xl"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 btn-secondary py-3 rounded-xl"
              >
                <Home size={18} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
