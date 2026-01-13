import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackMessage?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in child components, logs them,
 * and displays a fallback UI instead of crashing the app.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details to console
    console.error('ErrorBoundary caught an error:', error)
    console.error('Error info:', errorInfo)

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo)
  }

  handleRetry = (): void => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback UI matching the dark theme
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: '#0D1117' }}
        >
          <div
            className="max-w-md w-full p-8 rounded-2xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Error Icon */}
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="#EF4444"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h2
              className="text-2xl font-bold mb-3"
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                color: '#F0F6FC',
              }}
            >
              Something went wrong
            </h2>

            {/* Error Message */}
            <p
              className="text-sm mb-6"
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                color: '#8B949E',
              }}
            >
              {this.props.fallbackMessage ||
                'An unexpected error occurred. Please try again or contact support if the problem persists.'}
            </p>

            {/* Error Details (Development Only) */}
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div
                className="mb-6 p-4 rounded-lg text-left overflow-auto max-h-32"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <p
                  className="text-xs font-mono"
                  style={{ color: '#EF4444' }}
                >
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Retry Button */}
            <button
              onClick={this.handleRetry}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-300"
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                background: 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(230, 126, 34, 0.4)',
              }}
            >
              Try Again
            </button>

            {/* Home Link */}
            <button
              onClick={() => window.location.href = '/'}
              className="mt-3 text-sm underline"
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                color: '#8B949E',
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
