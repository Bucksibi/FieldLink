import { useState, useEffect } from 'react'
import SystemSelector from './SystemSelector'
import RefrigerantInput from './RefrigerantInput'
import TroubleshootingModeSelector from './TroubleshootingModeSelector'
import DataInputFormEnhanced from './DataInputFormEnhanced'
import ResultsDashboard from './ResultsDashboard'
import { SystemType, StandardReadings, DiagnosticResult, TroubleshootingMode } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface DiagnosticsInputPageProps {
  onNavigateToHistory: () => void
  onNavigateToChat: () => void
}

export default function DiagnosticsInputPage({ onNavigateToHistory, onNavigateToChat }: DiagnosticsInputPageProps) {
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

    // Check for loaded draft
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

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const formData = {
      locationAddress,
      systemType,
      refrigerant,
      troubleshootingMode,
      readings,
      userNotes,
    }
    localStorage.setItem('hvac_diagnostic_form_data', JSON.stringify(formData))
  }, [locationAddress, systemType, refrigerant, troubleshootingMode, readings, userNotes])

  // Check system configuration on mount
  useEffect(() => {
    const checkSystemConfig = async () => {
      try {
        const response = await fetch('/api/system-config', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
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
    if (!systemConfigured) {
      return 'System not configured. Please contact your administrator.'
    }

    if (!systemType) {
      return 'Please select a system type'
    }

    if (!troubleshootingMode) {
      return 'Please select a troubleshooting mode'
    }

    if (Object.keys(readings).length === 0) {
      return 'Please add at least one valid system reading'
    }

    return null
  }

  const handleRunDiagnostics = async () => {
    setError(null)
    setResult(null)

    // Validate inputs
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
        setResult(data) // Still show partial results if available
      } else {
        setResult(data)
        // Auto-navigate to history/results after successful diagnostic
        setTimeout(() => {
          onNavigateToHistory()
        }, 2000) // Wait 2 seconds to show results, then navigate
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

    // Dispatch event to update draft count
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

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Location Information Card */}
              <div className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Location Information
                </h2>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Service Address <span className="text-xs text-gray-700">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="e.g., 123 Main St, City, State 12345"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* System Configuration Card */}
              <div className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                <h2 className="text-xl font-semibold text-black mb-4">
                  System Configuration
                </h2>
                <div className="space-y-4">
                  <SystemSelector value={systemType} onChange={setSystemType} />
                  <RefrigerantInput value={refrigerant} onChange={setRefrigerant} />
                  {systemType && (
                    <TroubleshootingModeSelector
                      value={troubleshootingMode as TroubleshootingMode}
                      onChange={setTroubleshootingMode}
                    />
                  )}
                </div>
              </div>

              {/* System Readings Card */}
              <div className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                <DataInputFormEnhanced
                  onChange={setReadings}
                  systemType={systemType || null}
                  troubleshootingMode={troubleshootingMode || null}
                />
              </div>

              {/* Technician Notes Card */}
              <div className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Technician Notes
                </h2>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Any additional observations or context... (optional)"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 resize-none"
                />
              </div>
            </div>

            {/* Actions - Right Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Actions Card */}
              <div className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 sm:p-6 lg:sticky lg:top-6 hover:shadow-2xl transition-all duration-300">
                <h2 className="text-lg sm:text-xl font-semibold text-black mb-4">
                  Actions
                </h2>

                {/* Validation Summary */}
                <div className="mb-4 space-y-2 text-sm">
                  <div
                    className={`flex items-center gap-2 ${
                      systemConfigured ? 'text-green-600' : 'text-black'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${
                        systemConfigured ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    System configured
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      systemType ? 'text-green-600' : 'text-black'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${
                        systemType ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    System type selected
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      troubleshootingMode ? 'text-green-600' : 'text-black'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${
                        troubleshootingMode ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    Troubleshooting mode selected
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      Object.keys(readings).length > 0 ? 'text-green-600' : 'text-black'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${
                        Object.keys(readings).length > 0 ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    {Object.keys(readings).length} readings added
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleRunDiagnostics}
                    disabled={loading || !systemConfigured || !systemType || !troubleshootingMode || Object.keys(readings).length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 sm:py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {loadingStage === 'preparing' && 'Preparing request...'}
                        {loadingStage === 'sending' && 'Sending to AI...'}
                        {loadingStage === 'analyzing' && 'AI analyzing system...'}
                        {loadingStage === 'processing' && 'Processing results...'}
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                        Run Diagnostics
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveDraft}
                    disabled={!systemType || !troubleshootingMode || Object.keys(readings).length === 0}
                    className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 text-white font-semibold py-2 sm:py-3 px-6 rounded-lg transition-colors duration-200 text-sm sm:text-base touch-manipulation flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Draft
                  </button>

                  <button
                    onClick={handleClearFields}
                    className="w-full bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-semibold py-2 sm:py-3 px-6 rounded-lg transition-colors duration-200 text-sm sm:text-base touch-manipulation flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All Fields
                  </button>

                  {result && (
                    <button
                      onClick={handleReset}
                      className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold py-2 sm:py-3 px-6 rounded-lg transition-colors duration-200 text-sm sm:text-base touch-manipulation"
                    >
                      Reset & New Diagnostic
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="mt-8">
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
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 p-8 max-w-md w-full mx-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {loadingStage === 'preparing' && 'Preparing Diagnostic Request'}
                    {loadingStage === 'sending' && 'Sending Data for Analysis'}
                    {loadingStage === 'analyzing' && 'Analyzing HVAC System'}
                    {loadingStage === 'processing' && 'Processing Results'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {loadingStage === 'preparing' && 'Validating readings and preparing request...'}
                    {loadingStage === 'sending' && 'Communicating with diagnostic service...'}
                    {loadingStage === 'analyzing' && 'Analyzing your system data. This may take 10-30 seconds...'}
                    {loadingStage === 'processing' && 'Parsing and validating diagnostic results...'}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: loadingStage === 'preparing' ? '25%' :
                               loadingStage === 'sending' ? '50%' :
                               loadingStage === 'analyzing' ? '75%' : '95%'
                      }}
                    ></div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Analyzing your HVAC system...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
