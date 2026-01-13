import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

// Industrial Precision Design - HVAC Diagnostic Platform Login
export default function LoginPageEnhanced() {
  const { login, register, error } = useAuth()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Animated gauge values
  const [gaugeValues, setGaugeValues] = useState({ temp: 0, pressure: 0, flow: 0 })

  useEffect(() => {
    // Simulate diagnostic gauge readings
    const interval = setInterval(() => {
      setGaugeValues({
        temp: 68 + Math.random() * 8,
        pressure: 380 + Math.random() * 40,
        flow: 420 + Math.random() * 60,
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setLoading(true)

    try {
      if (isLoginMode) {
        await login(email, password)
      } else {
        if (!name.trim()) {
          setLocalError('Name is required')
          setLoading(false)
          return
        }
        await register(email, password, name)
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    setLocalError(null)
    setEmail('')
    setPassword('')
    setName('')
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0D1117' }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E67E22" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Radial Glow Effect */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(230, 126, 34, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Floating Technical Elements */}
      <div className="absolute top-20 left-20 opacity-20">
        <TechnicalDiagram />
      </div>
      <div className="absolute bottom-20 right-20 opacity-20 rotate-180">
        <TechnicalDiagram />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px]">
          {/* Logo & Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-10"
          >
            {/* Logo Mark */}
            <div className="inline-flex items-center justify-center mb-6">
              <div
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(230, 126, 34, 0.2) 0%, rgba(211, 84, 0, 0.1) 100%)',
                  border: '1px solid rgba(230, 126, 34, 0.3)',
                  boxShadow: '0 0 40px rgba(230, 126, 34, 0.2)',
                }}
              >
                <svg
                  className="w-10 h-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E67E22"
                  strokeWidth="1.5"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {/* Pulsing ring */}
                <div
                  className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                  style={{ border: '2px solid #E67E22' }}
                />
              </div>
            </div>

            <h1
              className="text-4xl font-bold tracking-tight mb-2"
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                color: '#F0F6FC',
              }}
            >
              Field<span style={{ color: '#E67E22' }}>Link</span>
            </h1>
            <p
              className="text-base"
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                color: '#8B949E',
              }}
            >
              Professional HVAC Diagnostic Platform
            </p>
          </motion.div>

          {/* Live Gauge Indicators */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex justify-center gap-6 mb-8"
          >
            <GaugeIndicator label="TEMP" value={gaugeValues.temp} unit="°F" color="#14B8A6" />
            <GaugeIndicator label="PSI" value={gaugeValues.pressure} unit="psi" color="#E67E22" />
            <GaugeIndicator label="CFM" value={gaugeValues.flow} unit="cfm" color="#3B82F6" />
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(240, 246, 252, 0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Card Header with Status Line */}
            <div
              className="h-1"
              style={{
                background: loading
                  ? 'linear-gradient(90deg, #E67E22 0%, #14B8A6 50%, #E67E22 100%)'
                  : 'linear-gradient(90deg, #E67E22 0%, #D35400 100%)',
                backgroundSize: loading ? '200% 100%' : '100% 100%',
                animation: loading ? 'shimmer 1.5s ease infinite' : 'none',
              }}
            />

            <div className="p-8">
              {/* Mode Tabs */}
              <div className="flex mb-8 p-1 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                <button
                  onClick={() => !loading && setIsLoginMode(true)}
                  className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    background: isLoginMode ? 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)' : 'transparent',
                    color: isLoginMode ? '#fff' : '#8B949E',
                    boxShadow: isLoginMode ? '0 4px 15px rgba(230, 126, 34, 0.4)' : 'none',
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => !loading && setIsLoginMode(false)}
                  className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    background: !isLoginMode ? 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)' : 'transparent',
                    color: !isLoginMode ? '#fff' : '#8B949E',
                    boxShadow: !isLoginMode ? '0 4px 15px rgba(230, 126, 34, 0.4)' : 'none',
                  }}
                >
                  Register
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode="wait">
                  {!isLoginMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <InputField
                        label="Full Name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        focused={focusedField === 'name'}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        }
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <InputField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="technician@hvac.com"
                  required
                  focused={focusedField === 'email'}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  }
                />

                <InputField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  focused={focusedField === 'password'}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  }
                />

                {/* Error Display */}
                <AnimatePresence>
                  {(error || localError) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-xl flex items-center gap-3"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm text-red-400" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                        {localError || error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    background: loading
                      ? 'rgba(230, 126, 34, 0.5)'
                      : 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(230, 126, 34, 0.4)',
                  }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isLoginMode ? 'Authenticating...' : 'Creating Account...'}
                    </>
                  ) : (
                    <>
                      {isLoginMode ? 'Access System' : 'Create Account'}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p
              className="text-xs"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: '#6E7681',
              }}
            >
              v1.0.0 • Powered by Gemini AI • AES-256 Encrypted
            </p>
          </motion.div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

// Sub-components

interface InputFieldProps {
  label: string
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  minLength?: number
  focused: boolean
  onFocus: () => void
  onBlur: () => void
  icon: React.ReactNode
}

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  focused,
  onFocus,
  onBlur,
  icon,
}: InputFieldProps) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-2"
        style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          color: focused ? '#E67E22' : '#8B949E',
          transition: 'color 0.2s ease',
        }}
      >
        {label}
      </label>
      <div
        className="relative rounded-xl overflow-hidden transition-all duration-300"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: focused ? '1px solid rgba(230, 126, 34, 0.5)' : '1px solid rgba(240, 246, 252, 0.1)',
          boxShadow: focused ? '0 0 20px rgba(230, 126, 34, 0.15)' : 'none',
        }}
      >
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
          style={{ color: focused ? '#E67E22' : '#6E7681' }}
        >
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full pl-12 pr-4 py-4 bg-transparent outline-none text-base"
          style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: '#F0F6FC',
          }}
        />
      </div>
    </div>
  )
}

interface GaugeIndicatorProps {
  label: string
  value: number
  unit: string
  color: string
}

function GaugeIndicator({ label, value, unit, color }: GaugeIndicatorProps) {
  return (
    <div
      className="px-4 py-3 rounded-xl text-center"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(240, 246, 252, 0.1)',
      }}
    >
      <div
        className="text-[10px] font-semibold tracking-wider mb-1"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          color: '#6E7681',
        }}
      >
        {label}
      </div>
      <div
        className="text-lg font-bold tabular-nums"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          color: color,
        }}
      >
        {value.toFixed(1)}
      </div>
      <div
        className="text-[10px]"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          color: '#6E7681',
        }}
      >
        {unit}
      </div>
    </div>
  )
}

function TechnicalDiagram() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="#E67E22" strokeWidth="0.5">
      <circle cx="100" cy="100" r="80" />
      <circle cx="100" cy="100" r="60" />
      <circle cx="100" cy="100" r="40" />
      <line x1="100" y1="20" x2="100" y2="180" />
      <line x1="20" y1="100" x2="180" y2="100" />
      <line x1="35" y1="35" x2="165" y2="165" />
      <line x1="165" y1="35" x2="35" y2="165" />
    </svg>
  )
}
