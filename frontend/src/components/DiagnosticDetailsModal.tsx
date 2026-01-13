import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { DiagnosticResult } from '../types'

interface DiagnosticDetailsModalProps {
  isOpen: boolean
  onClose: () => void
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

export default function DiagnosticDetailsModal({
  isOpen,
  onClose,
  result,
  inputDetails,
  onAskAI,
}: DiagnosticDetailsModalProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedSeverities, setExpandedSeverities] = useState<Set<string>>(new Set())

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

  const toggleSeverity = (severity: string) => {
    const newExpanded = new Set(expandedSeverities)
    if (newExpanded.has(severity)) {
      newExpanded.delete(severity)
    } else {
      newExpanded.add(severity)
    }
    setExpandedSeverities(newExpanded)
  }

  // Group faults by severity
  const faultsBySeverity = {
    critical: result.faults.filter(f => f.severity === 'critical'),
    warning: result.faults.filter(f => f.severity === 'warning'),
    info: result.faults.filter(f => f.severity === 'info'),
  }

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(section)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const copyMetric = (name: string, value: string) => {
    copyToClipboard(`${name}: ${value}`, `metric-${name}`)
  }

  const getStatusColor = () => {
    const status = result.system_status.toLowerCase()
    if (status === 'critical') {
      return 'from-red-500 to-red-700'
    } else if (status === 'attention_needed' || status === 'warning') {
      return 'from-yellow-500 to-yellow-700'
    } else {
      return 'from-green-500 to-green-700'
    }
  }

  const getStatusIcon = () => {
    const status = result.system_status.toLowerCase()
    if (status === 'critical') {
      return '✕'
    } else if (status === 'attention_needed' || status === 'warning') {
      return '⚠'
    } else {
      return '✓'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-7xl mx-auto bg-slate-800 rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-blue-500/20 bg-slate-900/50 rounded-t-2xl">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Diagnostic Details</h1>
              <div className="flex gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{new Date(result.timestamp).toLocaleString()}</span>
                </div>
                {inputDetails?.systemType && (
                  <div className="flex items-center gap-2">
                    <span>🔧</span>
                    <span>{inputDetails.systemType}</span>
                  </div>
                )}
                {result.model_used && (
                  <div className="flex items-center gap-2">
                    <span>🤖</span>
                    <span>{result.model_used.split('/')[1] || result.model_used}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {onAskAI && (
                <button
                  onClick={onAskAI}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 transition-all hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Ask AI About This
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 rounded-xl font-semibold hover:bg-slate-600 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print/PDF
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Status Banner */}
            <div className={`bg-gradient-to-r ${getStatusColor()} rounded-2xl p-6 text-white shadow-lg flex justify-between items-center`}>
              <div>
                <h2 className="text-3xl font-bold mb-2">Diagnostic Results</h2>
                <p className="text-lg opacity-90">
                  System Status: <span className="font-bold">{result.system_status.replace('_', ' ').toUpperCase()}</span>
                </p>
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-5xl">{getStatusIcon()}</span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Performance Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {result.metrics.delta_t !== undefined && (
                  <MetricCard
                    label="ΔT"
                    value={result.metrics.delta_t}
                    unit="°F"
                    description="Temperature difference between supply and return air"
                    onCopy={() => copyMetric('ΔT', `${result.metrics.delta_t}°F`)}
                    copied={copied === 'metric-ΔT'}
                  />
                )}
                {result.metrics.superheat !== undefined && (
                  <MetricCard
                    label="Superheat"
                    value={result.metrics.superheat}
                    unit="°F"
                    description="Temperature above saturation at suction line"
                    onCopy={() => copyMetric('Superheat', `${result.metrics.superheat}°F`)}
                    copied={copied === 'metric-Superheat'}
                  />
                )}
                {result.metrics.subcooling !== undefined && (
                  <MetricCard
                    label="Subcooling"
                    value={result.metrics.subcooling}
                    unit="°F"
                    description="Temperature below saturation at liquid line"
                    onCopy={() => copyMetric('Subcooling', `${result.metrics.subcooling}°F`)}
                    copied={copied === 'metric-Subcooling'}
                  />
                )}
                {result.metrics.efficiency_rating && (
                  <MetricCard
                    label="Efficiency Rating"
                    value={result.metrics.efficiency_rating}
                    description="Overall system efficiency assessment"
                    onCopy={() => copyMetric('Efficiency Rating', result.metrics.efficiency_rating)}
                    copied={copied === 'metric-Efficiency Rating'}
                  />
                )}
              </div>
            </div>

            {/* Diagnostic Summary */}
            <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/15 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Diagnostic Summary
                </h3>
                <button
                  onClick={() => copyToClipboard(result.summary, 'summary')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                >
                  {copied === 'summary' ? (
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
              <p className="text-sm text-slate-400 mb-3">{new Date(result.timestamp).toLocaleString()}</p>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{result.summary}</p>
            </div>

            {/* Issues Section - Organized by Severity */}
            {result.faults.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Issues Detected ({result.faults.length})
                </h3>
                <div className="space-y-3">
                  {/* Critical Issues */}
                  {faultsBySeverity.critical.length > 0 && (
                    <SeveritySection
                      severity="critical"
                      faults={faultsBySeverity.critical}
                      isExpanded={expandedSeverities.has('critical')}
                      onToggle={() => toggleSeverity('critical')}
                    />
                  )}

                  {/* Warning Issues */}
                  {faultsBySeverity.warning.length > 0 && (
                    <SeveritySection
                      severity="warning"
                      faults={faultsBySeverity.warning}
                      isExpanded={expandedSeverities.has('warning')}
                      onToggle={() => toggleSeverity('warning')}
                    />
                  )}

                  {/* Info Issues */}
                  {faultsBySeverity.info.length > 0 && (
                    <SeveritySection
                      severity="info"
                      faults={faultsBySeverity.info}
                      isExpanded={expandedSeverities.has('info')}
                      onToggle={() => toggleSeverity('info')}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {result.recommendations.length > 0 && (
              <div className="bg-slate-700/30 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Recommended Actions
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 font-semibold">
                      {checkedItems.size} / {result.recommendations.length} completed
                    </span>
                    <div className="w-48">
                      <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                        checkedItems.has(index)
                          ? 'bg-green-500/10 opacity-60'
                          : 'bg-slate-700/50 hover:bg-slate-700'
                      }`}
                      onClick={() => toggleCheck(index)}
                    >
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          checkedItems.has(index)
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500'
                            : 'border-blue-400'
                        }`}
                      >
                        {checkedItems.has(index) && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`${checkedItems.has(index) ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                          {rec}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Toast Notification */}
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 font-semibold z-[60]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied to clipboard!
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// Severity Section Component
function SeveritySection({
  severity,
  faults,
  isExpanded,
  onToggle,
}: {
  severity: string
  faults: any[]
  isExpanded: boolean
  onToggle: () => void
}) {
  const getSeverityConfig = () => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          icon: '🔴',
          label: 'Critical',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          icon: '⚠️',
          label: 'Warning',
        }
      default:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          icon: 'ℹ️',
          label: 'Info',
        }
    }
  }

  const config = getSeverityConfig()

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div className="flex items-center gap-3">
            <h4 className={`text-lg font-bold ${config.text}`}>
              {config.label}
            </h4>
            <span className={`text-sm font-semibold ${config.text} bg-white/10 px-3 py-1 rounded-full`}>
              {faults.length} {faults.length === 1 ? 'issue' : 'issues'}
            </span>
          </div>
        </div>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={`w-5 h-5 ${config.text}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {faults.map((fault, index) => (
                <IssueCard key={index} fault={fault} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Metric Card Component
function MetricCard({
  label,
  value,
  unit,
  description,
  onCopy,
  copied,
}: {
  label: string
  value: number | string
  unit?: string
  description?: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-slate-700/50 border border-green-500/30 rounded-2xl p-5 relative group"
    >
      <button
        onClick={onCopy}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-semibold text-slate-400">{label}</span>
        <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-4xl font-bold text-white">{value}</span>
        {unit && <span className="text-xl text-slate-400">{unit}</span>}
      </div>
      {description && <p className="text-xs text-slate-400 leading-relaxed">{description}</p>}
    </motion.div>
  )
}

// Issue Card Component
function IssueCard({ fault }: { fault: any }) {
  const getSeverityColor = () => {
    switch (fault.severity) {
      case 'critical':
        return {
          bg: 'from-red-500/15 to-red-600/15',
          border: 'border-red-500/30',
          badge: 'bg-red-600',
        }
      case 'warning':
        return {
          bg: 'from-yellow-500/15 to-yellow-600/15',
          border: 'border-yellow-500/30',
          badge: 'bg-yellow-600',
        }
      default:
        return {
          bg: 'from-blue-500/15 to-blue-600/15',
          border: 'border-blue-500/30',
          badge: 'bg-blue-600',
        }
    }
  }

  const colors = getSeverityColor()

  return (
    <div className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-2xl p-5`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <span className={`${colors.badge} text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase`}>
            {fault.severity}
          </span>
          <span className="text-sm font-semibold text-slate-300">{fault.component}</span>
        </div>
        {fault.confidence && (
          <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-semibold">
            {fault.confidence}% confidence
          </span>
        )}
      </div>
      <h4 className="text-xl font-bold text-white mb-2">{fault.issue}</h4>
      <p className="text-slate-300 mb-4 leading-relaxed">{fault.explanation}</p>
      <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <div className="text-xs font-semibold text-blue-400 mb-1">Recommended Action:</div>
            <div className="text-sm text-slate-200 leading-relaxed">{fault.recommended_action}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
