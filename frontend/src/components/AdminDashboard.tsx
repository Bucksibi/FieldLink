import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DiagnosticResult } from '../types'
import { motion } from 'framer-motion'

interface DiagnosticRecord {
  id: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
  locationAddress: string | null
  equipmentModel: string | null
  equipmentSerial: string | null
  systemType: string
  refrigerant: string | null
  readings: Record<string, number>
  userNotes: string | null
  modelId: string
  result: DiagnosticResult
  createdAt: string
}

export default function AdminDashboard() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'settings'>('diagnostics')
  const [diagnostics, setDiagnostics] = useState<DiagnosticRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<DiagnosticRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')

  // System settings state
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [models, setModels] = useState<Array<{ id: string; name: string }>>([])
  const [showApiKey, setShowApiKey] = useState(false)

  // Image analysis settings
  const [imageApiKey, setImageApiKey] = useState('')
  const [imageModel, setImageModel] = useState('')
  const [imageModels, setImageModels] = useState<Array<{ id: string; name: string }>>([])
  const [showImageApiKey, setShowImageApiKey] = useState(false)

  // API key status
  const [apiKeyPreview, setApiKeyPreview] = useState<string | null>(null)
  const [imageApiKeyPreview, setImageApiKeyPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchAllDiagnostics()
    fetchSystemSettings()
  }, [token])

  const fetchSystemSettings = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch system settings')
      }

      const data = await response.json()
      if (data.configured) {
        setSelectedModel(data.selectedModel)
        setApiKeyPreview(data.apiKeyPreview)

        if (data.imageAnalysisModel) {
          setImageModel(data.imageAnalysisModel)
        }
        if (data.imageApiKeyPreview) {
          setImageApiKeyPreview(data.imageApiKeyPreview)
        }
      }
    } catch (err) {
      console.error('Failed to fetch system settings:', err)
    }
  }

  const fetchModelsFromBackend = async (key: string) => {
    setSettingsLoading(true)
    setSettingsError(null)

    try {
      const response = await fetch('/api/admin/fetch-models', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: key }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to fetch models')
      }

      const data = await response.json()
      setModels(data.models)
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to fetch models')
      setModels([])
    } finally {
      setSettingsLoading(false)
    }
  }

  const fetchImageModelsFromBackend = async (key: string) => {
    setSettingsLoading(true)
    setSettingsError(null)

    try {
      const response = await fetch('/api/admin/fetch-models', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: key }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to fetch image models')
      }

      const data = await response.json()
      // Filter models that support vision/image analysis
      const visionModels = data.models.filter((m: any) =>
        m.id.includes('vision') ||
        m.id.includes('claude-3') ||
        m.id.includes('gpt-4') ||
        m.id.includes('gemini')
      )
      setImageModels(visionModels)
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to fetch image models')
      setImageModels([])
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    // Check if we have either a new key or existing key
    if (!apiKey.trim() && !apiKeyPreview) {
      setSettingsError('Please enter a text chat API key')
      return
    }

    if (!selectedModel) {
      setSettingsError('Please select a text chat model')
      return
    }

    // Validate image analysis settings if provided
    if (imageApiKey && !imageModel) {
      setSettingsError('Please select an image analysis model')
      return
    }

    if (imageModel && !imageApiKey && !imageApiKeyPreview) {
      setSettingsError('Please enter an image analysis API key')
      return
    }

    setSettingsLoading(true)
    setSettingsError(null)
    setSettingsSuccess(null)

    try {
      const body: any = {
        selectedModel: selectedModel,
      }

      // Only send text API key if user entered a new one
      if (apiKey.trim()) {
        body.openRouterKey = apiKey
      }

      // Only send image API key if user entered a new one
      if (imageApiKey.trim()) {
        body.imageAnalysisApiKey = imageApiKey
      }

      // Always send image model (can be null to clear it)
      if (imageModel || imageApiKeyPreview) {
        body.imageAnalysisModel = imageModel || null
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setSettingsSuccess('System settings saved successfully!')
      setTimeout(() => setSettingsSuccess(null), 3000)

      // Clear input fields so previews show
      setApiKey('')
      setImageApiKey('')

      // Refresh settings to get new previews
      fetchSystemSettings()
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  const fetchAllDiagnostics = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/admin/diagnostics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch diagnostics')
      }

      const data = await response.json()
      setDiagnostics(data.diagnostics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diagnostics')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800'
      case 'attention_needed':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto p-6 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    )
  }

  // Filter diagnostics
  const filteredDiagnostics = diagnostics.filter(d => {
    // Status filter
    if (statusFilter !== 'all' && d.result.system_status !== statusFilter) return false

    // User filter
    if (userFilter !== 'all' && d.user.email !== userFilter) return false

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        d.user.name.toLowerCase().includes(search) ||
        d.user.email.toLowerCase().includes(search) ||
        d.systemType.toLowerCase().includes(search) ||
        d.result.summary.toLowerCase().includes(search) ||
        d.modelId.toLowerCase().includes(search)
      )
    }

    return true
  })

  // Get unique users
  const uniqueUsers = [...new Set(diagnostics.map(d => d.user.email))]

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Admin Dashboard
          </h1>

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'diagnostics'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Diagnostic Records
              {activeTab === 'diagnostics' && (
                <span className="ml-2 text-sm">
                  ({filteredDiagnostics.length})
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              System Settings
            </button>
          </div>
        </motion.div>

        {/* Diagnostics Tab Content */}
        {activeTab === 'diagnostics' && (
          <>
            {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search diagnostics..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Statuses</option>
                <option value="normal">Normal</option>
                <option value="attention_needed">Attention Needed</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                User
              </label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(email => (
                  <option key={email} value={email}>{email}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== 'all' || userFilter !== 'all') && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setUserFilter('all')
                }}
                className="text-sm text-blue-400 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </motion.div>

        {/* Diagnostics Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 overflow-hidden"
        >
          {filteredDiagnostics.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-800 text-lg">
                No diagnostic records yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      System Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Model Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDiagnostics.map((record, index) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {formatDate(record.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">
                          {record.user.name}
                        </div>
                        <div className="text-sm text-gray-800">
                          {record.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {record.systemType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {record.modelId.split('/').pop()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.result.system_status)}`}>
                          {record.result.system_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
          </>
        )}

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 p-8 max-w-3xl"
          >
            <h2 className="text-2xl font-bold text-black mb-6">
              System Configuration
            </h2>

            <p className="text-gray-800 mb-8">
              Configure API keys and models for the system. All API keys will be stored securely and encrypted in the database.
            </p>

            {/* Section 1: Text Chat Configuration */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-black mb-4">
                💬 Text Chat Configuration
              </h3>
              <p className="text-sm text-gray-800 mb-6">
                Used for Sensei AI chat responses without images
              </p>

            {/* Success Message */}
            {settingsSuccess && (
              <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-sm text-green-800">{settingsSuccess}</p>
              </div>
            )}

            {/* Error Message */}
            {settingsError && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-800">{settingsError}</p>
              </div>
            )}

            {/* API Key Input */}
            <div className="mb-6">
              <label htmlFor="api-key" className="block text-sm font-medium text-black mb-2">
                OpenRouter API Key <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => apiKey && fetchModelsFromBackend(apiKey)}
                  disabled={!apiKey || settingsLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {settingsLoading ? 'Validating...' : 'Validate & Load Models'}
                </button>
              </div>
              <p className="text-xs text-gray-700 mt-2">
                Get your API key from{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  openrouter.ai/keys
                </a>
              </p>
              {apiKeyPreview && !apiKey && (
                <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ API Key Configured: <span className="font-mono">{apiKeyPreview}</span>
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Enter a new key above to update
                  </p>
                </div>
              )}
            </div>

            {/* Model Selection */}
            {models.length > 0 && (
              <div className="mb-8">
                <label htmlFor="model-select" className="block text-sm font-medium text-black mb-2">
                  Analysis Model <span className="text-red-500">*</span>
                </label>
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="">Select a model...</option>
                  <optgroup label="Recommended for HVAC Diagnostics">
                    {models
                      .filter((m) => m.id.includes('claude') || m.id.includes('gpt-4') || m.id.includes('gpt-3.5'))
                      .slice(0, 6)
                      .map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Other Models">
                    {models
                      .filter((m) => !m.id.includes('claude') && !m.id.includes('gpt-4') && !m.id.includes('gpt-3.5'))
                      .map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
                {selectedModel && (
                  <p className="text-xs text-gray-800 mt-2">
                    Selected: {models.find((m) => m.id === selectedModel)?.name}
                  </p>
                )}
              </div>
            )}
            </div>

            {/* Section 2: Image Analysis Configuration */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-black mb-4">
                🖼️ Image Analysis Configuration (Optional)
              </h3>
              <p className="text-sm text-gray-800 mb-6">
                Used when images are attached in Sensei AI chat. Leave empty to use text-only model.
              </p>

              {/* Image API Key Input */}
              <div className="mb-6">
                <label htmlFor="image-api-key" className="block text-sm font-medium text-black mb-2">
                  Image Analysis API Key (Optional)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      id="image-api-key"
                      type={showImageApiKey ? 'text' : 'password'}
                      value={imageApiKey}
                      onChange={(e) => setImageApiKey(e.target.value)}
                      placeholder="sk-or-v1-... (leave empty to disable image analysis)"
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowImageApiKey(!showImageApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showImageApiKey ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => imageApiKey && fetchImageModelsFromBackend(imageApiKey)}
                    disabled={!imageApiKey || settingsLoading}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg transition-colors"
                  >
                    {settingsLoading ? 'Loading...' : 'Load Vision Models'}
                  </button>
                </div>
                <p className="text-xs text-gray-800 mt-2">
                  Use same or different API key. Can use OpenRouter, OpenAI, Anthropic, or Google API.
                </p>
                {imageApiKeyPreview && !imageApiKey && (
                  <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Image API Key Configured: <span className="font-mono">{imageApiKeyPreview}</span>
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Enter a new key above to update
                    </p>
                  </div>
                )}
              </div>

              {/* Image Model Selection */}
              {imageModels.length > 0 && (
                <div className="mb-6">
                  <label htmlFor="image-model-select" className="block text-sm font-medium text-black mb-2">
                    Image Analysis Model
                  </label>
                  <select
                    id="image-model-select"
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Select a vision model...</option>
                    <optgroup label="Vision Models">
                      {imageModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {imageModel && (
                    <p className="text-xs text-gray-800 mt-2">
                      Selected: {imageModels.find((m) => m.id === imageModel)?.name}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={(!apiKey && !apiKeyPreview) || !selectedModel || settingsLoading}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors"
              >
                {settingsLoading ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRecord(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">
                Diagnostic Record Details
              </h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">User Information</h3>
                <div className="bg-gray-100 rounded-lg p-4 text-black">
                  <p className="text-sm"><strong>Name:</strong> {selectedRecord.user.name}</p>
                  <p className="text-sm"><strong>Email:</strong> {selectedRecord.user.email}</p>
                  <p className="text-sm"><strong>Date:</strong> {formatDate(selectedRecord.createdAt)}</p>
                </div>
              </div>

              {/* Location & Equipment Info */}
              {(selectedRecord.locationAddress || selectedRecord.equipmentModel || selectedRecord.equipmentSerial) && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">Location & Equipment</h3>
                  <div className="bg-gray-100 rounded-lg p-4 text-black">
                    {selectedRecord.locationAddress && (
                      <p className="text-sm"><strong>Location:</strong> {selectedRecord.locationAddress}</p>
                    )}
                    {selectedRecord.equipmentModel && (
                      <p className="text-sm"><strong>Equipment Model:</strong> {selectedRecord.equipmentModel}</p>
                    )}
                    {selectedRecord.equipmentSerial && (
                      <p className="text-sm"><strong>Serial Number:</strong> {selectedRecord.equipmentSerial}</p>
                    )}
                  </div>
                </div>
              )}

              {/* System Info */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">System Information</h3>
                <div className="bg-gray-100 rounded-lg p-4 text-black">
                  <p className="text-sm"><strong>System Type:</strong> {selectedRecord.systemType}</p>
                  <p className="text-sm"><strong>Refrigerant:</strong> {selectedRecord.refrigerant || 'Not specified'}</p>
                  <p className="text-sm"><strong>Analysis Model:</strong> {selectedRecord.modelId}</p>
                </div>
              </div>

              {/* Readings */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">System Readings</h3>
                <div className="bg-gray-100 rounded-lg p-4 text-black">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedRecord.readings, null, 2)}
                  </pre>
                </div>
              </div>

              {/* User Notes */}
              {selectedRecord.userNotes && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">Technician Notes</h3>
                  <div className="bg-gray-100 rounded-lg p-4 text-black">
                    <p className="text-sm">{selectedRecord.userNotes}</p>
                  </div>
                </div>
              )}

              {/* Result Summary */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">Diagnostic Result</h3>
                <div className="bg-gray-100 rounded-lg p-4 text-black">
                  <p className="text-sm mb-2">
                    <strong>Status:</strong>{' '}
                    <span className={`px-2 py-1 rounded ${getStatusColor(selectedRecord.result.system_status)}`}>
                      {selectedRecord.result.system_status.replace('_', ' ')}
                    </span>
                  </p>
                  <p className="text-sm mb-2"><strong>Summary:</strong> {selectedRecord.result.summary}</p>
                  <p className="text-sm"><strong>Faults Detected:</strong> {selectedRecord.result.faults.length}</p>
                </div>
              </div>

              {/* Full Result JSON */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">Full Result (JSON)</h3>
                <div className="bg-gray-100 text-black rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs">
                    {JSON.stringify(selectedRecord.result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
