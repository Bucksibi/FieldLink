import { useState, useEffect } from 'react'
import { GeminiModel } from '../types'

interface ModelManagerProps {
  onModelSelect: (modelId: string, apiKey: string) => void
  onApiKeyValidated?: (isValid: boolean) => void
}

const STORAGE_KEY = 'hvac_diagnostic_key'

interface OpenRouterModelsResponse {
  data: Array<{
    id: string
    name: string
    description?: string
    pricing?: {
      prompt: string
      completion: string
    }
  }>
}

export default function ModelManager({ onModelSelect, onApiKeyValidated }: ModelManagerProps) {
  const [apiKey, setApiKey] = useState('')
  const [storedApiKey, setStoredApiKey] = useState<string | null>(null)
  const [models, setModels] = useState<GeminiModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setStoredApiKey(stored)
      setApiKey(stored)
      fetchModels(stored)
    }
  }, [])

  const fetchModels = async (key: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key')
        }
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }

      const data: OpenRouterModelsResponse = await response.json()

      // Filter and sort models - prioritize popular HVAC-suitable models
      const filteredModels = data.data
        .filter((model) => !model.id.includes(':free')) // Exclude free tier models
        .sort((a, b) => {
          // Prioritize certain models
          const priority = [
            'anthropic/claude-3.5-sonnet',
            'anthropic/claude-3-opus',
            'anthropic/claude-3-haiku',
            'openai/gpt-4-turbo',
            'openai/gpt-4',
            'openai/gpt-3.5-turbo',
          ]

          const aIndex = priority.indexOf(a.id)
          const bIndex = priority.indexOf(b.id)

          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1

          return a.name.localeCompare(b.name)
        })
        .map((model) => ({
          id: model.id,
          name: model.name,
          description: model.description,
          pricing: model.pricing,
        }))

      setModels(filteredModels)
      onApiKeyValidated?.(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models')
      setModels([])
      setSelectedModel('')
      onApiKeyValidated?.(false)
    } finally {
      setLoading(false)
    }
  }

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    // Store in localStorage
    localStorage.setItem(STORAGE_KEY, apiKey)
    setStoredApiKey(apiKey)

    // Fetch models
    fetchModels(apiKey)
  }

  const handleClearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY)
    setStoredApiKey(null)
    setApiKey('')
    setModels([])
    setSelectedModel('')
    setError(null)
    onApiKeyValidated?.(false)
  }

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId)
    if (modelId && storedApiKey) {
      onModelSelect(modelId, storedApiKey)
    }
  }

  return (
    <div className="space-y-4">
      {/* API Key Section */}
      {!storedApiKey ? (
        <form onSubmit={handleApiKeySubmit} className="space-y-2">
          <label
            htmlFor="api-key"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
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
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showApiKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Validating...' : 'Connect'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Get your API key from{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              openrouter.ai/keys
            </a>
          </p>
        </form>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              API Key Connected
            </span>
          </div>
          <button
            onClick={handleClearApiKey}
            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Model Selection */}
      {models.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="model-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Analysis Model <span className="text-red-500">*</span>
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => handleModelSelect(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Select a model...</option>
            <optgroup label="Recommended for HVAC Diagnostics">
              {models
                .filter(
                  (m) =>
                    m.id.includes('claude') ||
                    m.id.includes('gpt-4') ||
                    m.id.includes('gpt-3.5')
                )
                .slice(0, 6)
                .map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Other Models">
              {models
                .filter(
                  (m) =>
                    !m.id.includes('claude') &&
                    !m.id.includes('gpt-4') &&
                    !m.id.includes('gpt-3.5')
                )
                .map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
            </optgroup>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {selectedModel
              ? `Selected: ${models.find((m) => m.id === selectedModel)?.name}`
              : 'Choose a model for diagnostic analysis'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}
