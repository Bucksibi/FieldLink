import { DiagnosticResult } from '../types'

interface DiagnosticResultsProps {
  result: DiagnosticResult
}

export default function DiagnosticResults({ result }: DiagnosticResultsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800'
      case 'attention_needed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200 dark:border-gray-800'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white'
      case 'warning':
        return 'bg-yellow-600 text-white'
      case 'info':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  const getEfficiencyColor = (rating?: string) => {
    switch (rating) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400'
      case 'good':
        return 'text-blue-600 dark:text-blue-400'
      case 'fair':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'poor':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Diagnostic Results
          </h2>
          <div className={`px-4 py-2 rounded-lg border-2 font-semibold ${getStatusColor(result.system_status)}`}>
            {result.system_status.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* Summary */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300">{result.summary}</p>
        </div>
      </div>

      {/* Performance Metrics */}
      {Object.keys(result.metrics).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Performance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {result.metrics.delta_t !== undefined && (
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700">
                <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">ΔT</div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {result.metrics.delta_t}<span className="text-lg ml-1">°F</span>
                </div>
              </div>
            )}
            {result.metrics.superheat !== undefined && (
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700">
                <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Superheat</div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {result.metrics.superheat}<span className="text-lg ml-1">°F</span>
                </div>
              </div>
            )}
            {result.metrics.subcooling !== undefined && (
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700">
                <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Subcooling</div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {result.metrics.subcooling}<span className="text-lg ml-1">°F</span>
                </div>
              </div>
            )}
            {result.metrics.efficiency_rating && (
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700">
                <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Efficiency Rating</div>
                <div className={`text-3xl font-bold capitalize ${getEfficiencyColor(result.metrics.efficiency_rating)}`}>
                  {result.metrics.efficiency_rating}
                </div>
              </div>
            )}
            {Object.entries(result.metrics)
              .filter(
                ([key]) =>
                  !['delta_t', 'superheat', 'subcooling', 'efficiency_rating'].includes(key)
              )
              .map(([key, value]) => (
                <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xl font-bold text-gray-800 dark:text-white">
                    {typeof value === 'number' ? value.toFixed(1) : value}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Faults */}
      {result.faults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Issues Detected ({result.faults.length})
          </h3>
          <div className="space-y-4">
            {result.faults.map((fault, index) => (
              <div
                key={index}
                className="p-4 border-l-4 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-r-lg"
                style={{
                  borderLeftColor:
                    fault.severity === 'critical'
                      ? '#dc2626'
                      : fault.severity === 'warning'
                      ? '#d97706'
                      : '#3b82f6',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold mr-2 ${getSeverityBadge(
                        fault.severity
                      )}`}
                    >
                      {fault.severity.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {fault.component}
                    </span>
                  </div>
                  {fault.confidence && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {fault.confidence}% confidence
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                  {fault.issue}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {fault.explanation}
                </p>
                <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">
                      Recommended Action:
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {fault.recommended_action}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Recommendations
          </h3>
          <ul className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <p className="text-gray-700 dark:text-gray-300 pt-0.5">{rec}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Issues */}
      {result.faults.length === 0 && result.system_status === 'normal' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <svg
              className="w-12 h-12 text-green-600 dark:text-green-400"
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
            <div>
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">
                System Operating Normally
              </h3>
              <p className="text-green-700 dark:text-green-300">
                No significant issues detected. System performance is within expected parameters.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
