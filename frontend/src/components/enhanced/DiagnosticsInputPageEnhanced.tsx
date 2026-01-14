import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SystemSelector from '../SystemSelector'
import RefrigerantInput from '../RefrigerantInput'
import TroubleshootingModeSelector from '../TroubleshootingModeSelector'
import DataInputFormEnhanced from '../DataInputFormEnhanced'
import ResultsDashboard from '../ResultsDashboard'
import { SystemType, StandardReadings, DiagnosticResult, TroubleshootingMode } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

interface DiagnosticsInputPageProps {
  onNavigateToHistory: () => void
  onNavigateToChat: () => void
}

export default function DiagnosticsInputPageEnhanced({ onNavigateToHistory, onNavigateToChat }: DiagnosticsInputPageProps) {
  const { token } = useAuth()
  const [locationAddress, setLocationAddress] = useState('')
  const [systemType, setSystemType] = useState<SystemType | ''>('')
  const [refrigerant, setRefrigerant] = useState('')
  const [troubleshootingMode, setTroubleshootingMode] = useState<TroubleshootingMode | ''>('')
  const [readings, setReadings] = useState<StandardReadings>({})
  const [userNotes, setUserNotes] = useState('')

  const [systemConfigured, setSystemConfigured] = useState(false)
  const [, setSelectedModel] = useState<string | null>(null)
  const [, setConfigLoading] = useState(true)

  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<'preparing' | 'sending' | 'analyzing' | 'processing'>('preparing')
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('hvac_diagnostic_form_data')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        setLocationAddress(data.locationAddress || '')
        setSystemType(data.systemType || '')
        setRefrigerant(data.refrigerant || '')
        setTroubleshootingMode(data.troubleshootingMode || '')
        setReadings(data.readings || {})
        setUserNotes(data.userNotes || '')
      } catch (e) {
        console.error('Failed to load saved form data:', e)
      }
    }

    const loadedDraft = localStorage.getItem('hvac_current_draft')
    if (loadedDraft) {
      try {
        const draft = JSON.parse(loadedDraft)
        setLocationAddress(draft.locationAddress || '')
        setSystemType(draft.systemType || '')
        setRefrigerant(draft.refrigerant || '')
        setTroubleshootingMode(draft.troubleshootingMode || '')
        setReadings(draft.readings || {})
        setUserNotes(draft.userNotes || '')
        localStorage.removeItem('hvac_current_draft')
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
  }, [])

  // Save form data to localStorage
  useEffect(() => {
    const formData = { locationAddress, systemType, refrigerant, troubleshootingMode, readings, userNotes }
    localStorage.setItem('hvac_diagnostic_form_data', JSON.stringify(formData))
  }, [locationAddress, systemType, refrigerant, troubleshootingMode, readings, userNotes])

  // Check system configuration
  useEffect(() => {
    const checkSystemConfig = async () => {
      try {
        const response = await fetch('/api/system-config', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          setSystemConfigured(data.configured)
          setSelectedModel(data.selectedModel)
        }
      } catch (err) {
        console.error('Failed to check system configuration:', err)
      } finally {
        setConfigLoading(false)
      }
    }
    checkSystemConfig()
  }, [token])

  const validateInputs = (): string | null => {
    if (!systemConfigured) return 'System not configured. Please contact your administrator.'
    if (!systemType) return 'Please select a system type'
    if (!troubleshootingMode) return 'Please select a troubleshooting mode'
    if (Object.keys(readings).length === 0) return 'Please add at least one valid system reading'
    return null
  }

  const handleRunDiagnostics = async () => {
    setError(null)
    setResult(null)

    const validationError = validateInputs()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setLoadingStage('preparing')

    try {
      const requestBody = {
        location_address: locationAddress || undefined,
        system_type: systemType,
        refrigerant: refrigerant || null,
        readings_std: readings,
        user_notes: userNotes || undefined,
      }

      setLoadingStage('sending')
      const response = await fetch('/api/diagnostics/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      setLoadingStage('analyzing')
      const data: DiagnosticResult = await response.json()
      setLoadingStage('processing')

      if (!response.ok) {
        throw new Error(data.error_message || 'Failed to run diagnostics')
      }

      if (data.status === 'error') {
        setError(data.error_message || 'Diagnostic analysis failed')
        setResult(data)
      } else {
        setResult(data)
        setTimeout(() => onNavigateToHistory(), 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = () => {
    const draft = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      locationAddress,
      systemType: systemType as SystemType,
      refrigerant,
      troubleshootingMode: troubleshootingMode as TroubleshootingMode,
      readings,
      userNotes,
    }

    const existingDrafts = JSON.parse(localStorage.getItem('hvac_diagnostic_drafts') || '[]')
    existingDrafts.push(draft)
    localStorage.setItem('hvac_diagnostic_drafts', JSON.stringify(existingDrafts))
    window.dispatchEvent(new Event('draftsUpdated'))
    alert('Draft saved successfully!')
  }

  const handleClearFields = () => {
    if (confirm('Clear all fields? This will erase all current data.')) {
      setLocationAddress('')
      setSystemType('')
      setRefrigerant('')
      setTroubleshootingMode('')
      setReadings({})
      setUserNotes('')
      setResult(null)
      setError(null)
    }
  }

  const handleReset = () => {
    setLocationAddress('')
    setSystemType('')
    setRefrigerant('')
    setTroubleshootingMode('')
    setReadings({})
    setUserNotes('')
    setResult(null)
    setError(null)
  }

  // Validation checklist items
  const validationItems = [
    { label: 'System configured', complete: systemConfigured },
    { label: 'System type selected', complete: !!systemType },
    { label: 'Mode selected', complete: !!troubleshootingMode },
    { label: `${Object.keys(readings).length} readings`, complete: Object.keys(readings).length > 0 },
  ]

  const allValid = validationItems.every(item => item.complete)

  return (
    <div className="min-h-screen" style={{ background: '#0D1117' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Location Information Card */}
              <Card title="Location Information" icon={<LocationIcon />} delay={0}>
                <div>
                  <Label>Service Address <span className="text-[#6E7681]">(Optional)</span></Label>
                  <Input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="e.g., 123 Main St, City, State 12345"
                  />
                </div>
              </Card>

              {/* System Configuration Card */}
              <Card title="System Configuration" icon={<GearIcon />} delay={0.1}>
                <div className="space-y-5">
                  <div className="enhanced-select">
                    <SystemSelector value={systemType} onChange={setSystemType} />
                  </div>
                  <div className="enhanced-select">
                    <RefrigerantInput value={refrigerant} onChange={setRefrigerant} />
                  </div>
                  {systemType && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="enhanced-select"
                    >
                      <TroubleshootingModeSelector
                        value={troubleshootingMode as TroubleshootingMode}
                        onChange={setTroubleshootingMode}
                      />
                    </motion.div>
                  )}
                </div>
              </Card>

              {/* System Readings Card */}
              <Card title="System Readings" icon={<GaugeIcon />} delay={0.2}>
                <div className="enhanced-form">
                  <DataInputFormEnhanced
                    onChange={setReadings}
                    systemType={systemType || null}
                    troubleshootingMode={troubleshootingMode || null}
                  />
                </div>
              </Card>

              {/* Technician Notes Card */}
              <Card title="Technician Notes" icon={<NoteIcon />} delay={0.3}>
                <div>
                  <Label>Additional Observations <span className="text-[#6E7681]">(Optional)</span></Label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="Any additional observations or context..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl outline-none resize-none transition-all duration-200"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(240, 246, 252, 0.1)',
                      color: '#F0F6FC',
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                    }}
                  />
                </div>
              </Card>
            </div>

            {/* Actions - Right Column */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Validation Status Card */}
                <Card title="Validation Status" icon={<ChecklistIcon />} delay={0.4}>
                  <div className="space-y-3">
                    {validationItems.map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300"
                          style={{
                            background: item.complete
                              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                              : 'rgba(0, 0, 0, 0.3)',
                            border: item.complete
                              ? 'none'
                              : '1px solid rgba(240, 246, 252, 0.1)',
                            boxShadow: item.complete ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
                          }}
                        >
                          {item.complete && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span
                          className="text-sm"
                          style={{
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                            color: item.complete ? '#10B981' : '#8B949E',
                          }}
                        >
                          {item.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Progress Ring */}
                  <div className="mt-6 flex justify-center">
                    <ProgressRing progress={validationItems.filter(i => i.complete).length / validationItems.length * 100} />
                  </div>
                </Card>

                {/* Error Display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-xl"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-400" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                          {error}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <Card title="Actions" icon={<BoltIcon />} delay={0.5}>
                  <div className="space-y-3">
                    {/* Run Diagnostics Button */}
                    <ActionButton
                      onClick={handleRunDiagnostics}
                      disabled={loading || !allValid}
                      variant="primary"
                      loading={loading}
                      loadingText={
                        loadingStage === 'preparing' ? 'Preparing...' :
                        loadingStage === 'sending' ? 'Sending...' :
                        loadingStage === 'analyzing' ? 'Analyzing...' : 'Processing...'
                      }
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Run Diagnostics
                    </ActionButton>

                    {/* Save Draft Button */}
                    <ActionButton
                      onClick={handleSaveDraft}
                      disabled={!systemType || !troubleshootingMode || Object.keys(readings).length === 0}
                      variant="secondary"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save Draft
                    </ActionButton>

                    {/* Clear Fields Button */}
                    <ActionButton onClick={handleClearFields} variant="ghost">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear All Fields
                    </ActionButton>

                    {result && (
                      <ActionButton onClick={handleReset} variant="warning">
                        Reset & New Diagnostic
                      </ActionButton>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <ResultsDashboard
                result={result}
                inputDetails={{
                  locationAddress,
                  systemType,
                  refrigerant,
                  troubleshootingMode,
                  readings,
                  userNotes
                }}
                onAskAI={onNavigateToChat}
              />
            </motion.div>
          )}

          {/* Loading Overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="max-w-md w-full mx-4 p-8 rounded-2xl text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    border: '1px solid rgba(240, 246, 252, 0.1)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {/* Animated Loading Ring */}
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <svg className="w-full h-full animate-spin" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="rgba(230, 126, 34, 0.2)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#E67E22"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="60 190"
                      />
                    </svg>
                    <div
                      className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
                      style={{ fontFamily: '"JetBrains Mono", monospace', color: '#E67E22' }}
                    >
                      {loadingStage === 'preparing' ? '25%' :
                       loadingStage === 'sending' ? '50%' :
                       loadingStage === 'analyzing' ? '75%' : '95%'}
                    </div>
                  </div>

                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F0F6FC' }}
                  >
                    {loadingStage === 'preparing' && 'Preparing Request'}
                    {loadingStage === 'sending' && 'Sending Data'}
                    {loadingStage === 'analyzing' && 'AI Analysis'}
                    {loadingStage === 'processing' && 'Processing Results'}
                  </h3>
                  <p
                    className="text-sm mb-6"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E' }}
                  >
                    {loadingStage === 'preparing' && 'Validating readings and preparing request...'}
                    {loadingStage === 'sending' && 'Communicating with Gemini AI...'}
                    {loadingStage === 'analyzing' && 'Analyzing your HVAC system data...'}
                    {loadingStage === 'processing' && 'Parsing and validating results...'}
                  </p>

                  {/* Progress Bar */}
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'rgba(0, 0, 0, 0.3)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #E67E22 0%, #14B8A6 100%)' }}
                      initial={{ width: '0%' }}
                      animate={{
                        width: loadingStage === 'preparing' ? '25%' :
                               loadingStage === 'sending' ? '50%' :
                               loadingStage === 'analyzing' ? '75%' : '95%'
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Styles */}
      <style>{`
        .enhanced-select select,
        .enhanced-form input,
        .enhanced-form select {
          background: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(240, 246, 252, 0.1) !important;
          color: #F0F6FC !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          font-family: "Plus Jakarta Sans", sans-serif !important;
        }
        .enhanced-select select:focus,
        .enhanced-form input:focus,
        .enhanced-form select:focus {
          border-color: rgba(230, 126, 34, 0.5) !important;
          box-shadow: 0 0 20px rgba(230, 126, 34, 0.15) !important;
          outline: none !important;
        }
        .enhanced-select select option,
        .enhanced-form select option {
          background: #161B22 !important;
          color: #F0F6FC !important;
        }
      `}</style>
    </div>
  )
}

// ==================== Sub Components ====================

interface CardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  delay?: number
}

function Card({ title, icon, children, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        border: '1px solid rgba(240, 246, 252, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Card Header */}
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(240, 246, 252, 0.05)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(230, 126, 34, 0.2) 0%, rgba(211, 84, 0, 0.1) 100%)',
            border: '1px solid rgba(230, 126, 34, 0.3)',
          }}
        >
          <span className="w-4 h-4 text-[#E67E22]">{icon}</span>
        </div>
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F0F6FC' }}
        >
          {title}
        </h2>
      </div>
      {/* Card Body */}
      <div className="p-6">{children}</div>
    </motion.div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-sm font-medium mb-2"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E' }}
    >
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(240, 246, 252, 0.1)',
        color: '#F0F6FC',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    />
  )
}

interface ActionButtonProps {
  onClick: () => void
  disabled?: boolean
  variant: 'primary' | 'secondary' | 'ghost' | 'warning'
  children: React.ReactNode
  loading?: boolean
  loadingText?: string
}

function ActionButton({ onClick, disabled, variant, children, loading, loadingText }: ActionButtonProps) {
  const styles = {
    primary: {
      background: disabled ? 'rgba(230, 126, 34, 0.3)' : 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
      border: 'none',
      color: '#fff',
      boxShadow: disabled ? 'none' : '0 4px 20px rgba(230, 126, 34, 0.4)',
    },
    secondary: {
      background: disabled ? 'rgba(20, 184, 166, 0.2)' : 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
      border: 'none',
      color: '#fff',
      boxShadow: disabled ? 'none' : '0 4px 20px rgba(20, 184, 166, 0.3)',
    },
    ghost: {
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(240, 246, 252, 0.1)',
      color: '#8B949E',
      boxShadow: 'none',
    },
    warning: {
      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      border: 'none',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
    },
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className="w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200"
      style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...styles[variant],
      }}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </motion.button>
  )
}

function ProgressRing({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="48" cy="48" r="36"
          fill="none"
          stroke="rgba(240, 246, 252, 0.1)"
          strokeWidth="6"
        />
        <circle
          cx="48" cy="48" r="36"
          fill="none"
          stroke={progress === 100 ? '#10B981' : '#E67E22'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-lg font-bold"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          color: progress === 100 ? '#10B981' : '#E67E22',
        }}
      >
        {Math.round(progress)}%
      </div>
    </div>
  )
}

// ==================== Icons ====================

function LocationIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function GaugeIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function ChecklistIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
