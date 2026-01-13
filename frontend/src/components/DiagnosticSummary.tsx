import { motion } from 'framer-motion'
import { useState } from 'react'

interface DiagnosticSummaryProps {
  summary: string
  rawData?: object
  timestamp?: string
  modelUsed?: string
}

export default function DiagnosticSummary({
  summary,
  rawData,
  timestamp,
  modelUsed,
}: DiagnosticSummaryProps) {
  const [showRawJSON, setShowRawJSON] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleCopyJSON = async () => {
    if (!rawData) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(rawData, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-xl font-bold text-white">Diagnostic Summary</h2>
          </div>
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Summary
              </>
            )}
          </button>
        </div>

        {/* Metadata - Compact */}
        {timestamp && (
          <div className="mt-2 text-xs text-white/60">
            {new Date(timestamp).toLocaleString()}
          </div>
        )}
      </div>

      {/* Summary Text */}
      <div className="px-6 py-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="prose dark:prose-invert max-w-none"
        >
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </motion.div>
      </div>

      {/* Raw JSON Toggle */}
      {rawData && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowRawJSON(!showRawJSON)}
            className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <span>Advanced: View Raw JSON</span>
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${showRawJSON ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* JSON Display */}
          <motion.div
            initial={false}
            animate={{
              height: showRawJSON ? 'auto' : 0,
              opacity: showRawJSON ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="relative">
                <button
                  onClick={handleCopyJSON}
                  className="absolute top-2 right-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
