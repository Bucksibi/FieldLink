import { motion } from 'framer-motion'
import { useState } from 'react'
import DiagnosticResultCard, { MetricSeverity } from './DiagnosticResultCard'
import DiagnosticSummary from './DiagnosticSummary'
import { DiagnosticResult, DiagnosticFault } from '../types'

interface ResultsDashboardProps {
  result: DiagnosticResult
  inputDetails?: {
    locationAddress?: string
    systemType?: string
    refrigerant?: string
    troubleshootingMode?: string
    readings?: Record<string, number>
    userNotes?: string
  }
  onAskAI?: () => void
}

interface MetricCardData {
  name: string
  value: number | string
  unit?: string
  severity: MetricSeverity
  description?: string
}

export default function ResultsDashboard({ result, inputDetails, onAskAI }: ResultsDashboardProps) {
  // State for checkable recommendations
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)

  const toggleCheck = (index: number) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(index)) {
      newChecked.delete(index)
    } else {
      newChecked.add(index)
    }
    setCheckedItems(newChecked)
  }

  const progress = result.recommendations.length > 0
    ? (checkedItems.size / result.recommendations.length) * 100
    : 0

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(section)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatInputDetails = () => {
    if (!inputDetails) return ''
    let text = '=== DIAGNOSTIC DETAILS ===\n\n'
    if (inputDetails.locationAddress) text += `Location: ${inputDetails.locationAddress}\n`
    if (inputDetails.systemType) text += `System Type: ${inputDetails.systemType}\n`
    if (inputDetails.refrigerant) text += `Refrigerant: ${inputDetails.refrigerant}\n`
    if (inputDetails.troubleshootingMode) text += `Mode: ${inputDetails.troubleshootingMode}\n`
    if (inputDetails.readings) {
      text += '\nSystem Readings:\n'
      Object.entries(inputDetails.readings).forEach(([key, value]) => {
        text += `  ${key.replace(/_/g, ' ')}: ${value}°\n`
      })
    }
    if (inputDetails.userNotes) text += `\nTechnician Notes: ${inputDetails.userNotes}\n`
    return text
  }

  const formatIssues = () => {
    let text = '=== ISSUES DETECTED ===\n\n'
    result.faults.forEach((fault, index) => {
      text += `${index + 1}. [${fault.severity.toUpperCase()}] ${fault.component}\n`
      text += `   Issue: ${fault.issue}\n`
      text += `   ${fault.explanation}\n`
      text += `   Action: ${fault.recommended_action}\n`
      text += `   Confidence: ${fault.confidence}%\n\n`
    })
    return text
  }

  // Determine severity based on system status and metric values
  const getMetricSeverity = (metricName: string, _value: number | string): MetricSeverity => {
    if (result.system_status === 'critical') return 'fault'
    if (result.system_status === 'attention_needed') return 'warning'

    // Check if any faults mention this metric
    const relatedFault = result.faults.find((fault) =>
      fault.issue.toLowerCase().includes(metricName.toLowerCase())
    )

    if (relatedFault) {
      if (relatedFault.severity === 'critical') return 'fault'
      if (relatedFault.severity === 'warning') return 'warning'
      return 'info'
    }

    return 'normal'
  }

  // Convert metrics object to array of card data
  const metricCards: MetricCardData[] = []

  // Priority metrics first
  const priorityMetrics = ['delta_t', 'superheat', 'subcooling', 'efficiency_rating']

  priorityMetrics.forEach((key) => {
    if (result.metrics[key] !== undefined && result.metrics[key] !== null) {
      const value = result.metrics[key]
      metricCards.push({
        name: key === 'delta_t' ? 'ΔT' : key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: value,
        unit: key === 'efficiency_rating' ? undefined : '°F',
        severity: getMetricSeverity(key, value),
        description: getMetricDescription(key),
      })
    }
  })

  // Other metrics
  Object.entries(result.metrics)
    .filter(([key]) => !priorityMetrics.includes(key))
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        metricCards.push({
          name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          value: value,
          unit: typeof value === 'number' ? '°F' : undefined,
          severity: getMetricSeverity(key, value),
        })
      }
    })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`bg-gradient-to-r ${
          result.system_status === 'critical'
            ? 'from-red-500 to-red-700'
            : result.system_status === 'attention_needed'
            ? 'from-yellow-500 to-yellow-700'
            : 'from-green-500 to-green-700'
        } rounded-xl p-6 text-white shadow-2xl`}
      >
        {/* Metadata Bar */}
        <div className="flex items-center justify-between mb-4 text-sm text-white/80">
          <div className="flex items-center gap-4">
            <span>📅 {new Date(result.timestamp).toLocaleString()}</span>
            {result.model_used && <span>🤖 {result.model_used.split('/')[1] || result.model_used}</span>}
          </div>
          {onAskAI && (
            <button
              onClick={onAskAI}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Ask AI About This
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Diagnostic Results</h1>
            <p className="text-white/90 text-lg">
              System Status: <span className="font-semibold">{result.system_status.replace('_', ' ').toUpperCase()}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">
              {result.system_status === 'normal' ? '✓' : result.system_status === 'critical' ? '✕' : '⚠'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Diagnostic Details - Compact Input Summary */}
      {inputDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Diagnostic Details</h2>
            <button
              onClick={() => copyToClipboard(formatInputDetails(), 'details')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              {copied === 'details' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {inputDetails.locationAddress && (
              <div className="flex">
                <span className="font-semibold text-gray-600 dark:text-gray-400 w-32">Location:</span>
                <span className="text-gray-800 dark:text-gray-200">{inputDetails.locationAddress}</span>
              </div>
            )}
            {inputDetails.systemType && (
              <div className="flex">
                <span className="font-semibold text-gray-600 dark:text-gray-400 w-32">System Type:</span>
                <span className="text-gray-800 dark:text-gray-200">{inputDetails.systemType}</span>
              </div>
            )}
            {inputDetails.refrigerant && (
              <div className="flex">
                <span className="font-semibold text-gray-600 dark:text-gray-400 w-32">Refrigerant:</span>
                <span className="text-gray-800 dark:text-gray-200">{inputDetails.refrigerant}</span>
              </div>
            )}
            {inputDetails.troubleshootingMode && (
              <div className="flex">
                <span className="font-semibold text-gray-600 dark:text-gray-400 w-32">Mode:</span>
                <span className="text-gray-800 dark:text-gray-200">{inputDetails.troubleshootingMode}</span>
              </div>
            )}
          </div>

          {/* System Readings */}
          {inputDetails.readings && Object.keys(inputDetails.readings).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm">System Readings:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(inputDetails.readings).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-1">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-lg font-bold text-gray-800 dark:text-white">
                      {value}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technician Notes */}
          {inputDetails.userNotes && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">Technician Notes:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">{inputDetails.userNotes}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Performance Metrics Grid */}
      {metricCards.length > 0 && (
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-bold text-gray-800 dark:text-white mb-4"
          >
            Performance Metrics
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {metricCards.map((metric, index) => (
              <DiagnosticResultCard
                key={metric.name}
                name={metric.name}
                value={metric.value}
                unit={metric.unit}
                severity={metric.severity}
                description={metric.description}
                index={index}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* Diagnostic Summary */}
      <DiagnosticSummary
        summary={result.summary}
        rawData={result}
        timestamp={result.timestamp}
        modelUsed={result.model_used}
      />

      {/* Faults Section */}
      {result.faults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Issues Detected ({result.faults.length})
            </h2>
            <button
              onClick={() => copyToClipboard(formatIssues(), 'issues')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              {copied === 'issues' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="space-y-4">
            {result.faults.map((fault, index) => (
              <FaultCard key={index} fault={fault} index={index} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Recommended Actions
              </h2>
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {checkedItems.size} / {result.recommendations.length} completed
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
              />
            </div>
          </div>

          <ul className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => toggleCheck(index)}
              >
                <div className="flex-shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    checked={checkedItems.has(index)}
                    onChange={() => toggleCheck(index)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                  />
                </div>
                <p className={`flex-1 ${checkedItems.has(index) ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {rec}
                </p>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* No Issues State */}
      {result.faults.length === 0 && result.system_status === 'normal' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-8 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <svg
              className="w-20 h-20 text-green-600 dark:text-green-400 mx-auto mb-4"
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
          </motion.div>
          <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
            All Systems Normal
          </h3>
          <p className="text-green-700 dark:text-green-300 text-lg">
            No significant issues detected. System is operating within expected parameters.
          </p>
        </motion.div>
      )}
    </div>
  )
}

// Fault Card Component
function FaultCard({ fault, index }: { fault: DiagnosticFault; index: number }) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-300 dark:border-red-700',
          badge: 'bg-red-600',
          icon: 'text-red-600 dark:text-red-400',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-300 dark:border-yellow-700',
          badge: 'bg-yellow-600',
          icon: 'text-yellow-600 dark:text-yellow-400',
        }
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-300 dark:border-blue-700',
          badge: 'bg-blue-600',
          icon: 'text-blue-600 dark:text-blue-400',
        }
    }
  }

  const config = getSeverityConfig(fault.severity)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`${config.bg} border-l-4 ${config.border} rounded-r-xl p-5 shadow-md hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`${config.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
            {fault.severity.toUpperCase()}
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {fault.component}
          </span>
        </div>
        {fault.confidence && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded">
            {fault.confidence}% confidence
          </span>
        )}
      </div>

      <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{fault.issue}</h4>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{fault.explanation}</p>

      <div className="flex items-start gap-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
        <svg
          className={`w-5 h-5 ${config.icon} flex-shrink-0 mt-0.5`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Recommended Action:
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">
            {fault.recommended_action}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Helper function for metric descriptions
function getMetricDescription(metricName: string): string | undefined {
  const descriptions: Record<string, string> = {
    delta_t: 'Temperature difference between supply and return air',
    superheat: 'Temperature above saturation at suction line',
    subcooling: 'Temperature below saturation at liquid line',
    efficiency_rating: 'Overall system efficiency assessment',
  }
  return descriptions[metricName]
}
