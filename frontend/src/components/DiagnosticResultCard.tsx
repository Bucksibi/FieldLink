import { motion } from 'framer-motion'

export type MetricSeverity = 'normal' | 'warning' | 'fault' | 'info'

interface DiagnosticResultCardProps {
  name: string
  value: number | string
  unit?: string
  severity?: MetricSeverity
  description?: string
  index?: number
}

const severityConfig = {
  normal: {
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-600 dark:text-green-400',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  warning: {
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  fault: {
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-600 dark:text-red-400',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  info: {
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
}

export default function DiagnosticResultCard({
  name,
  value,
  unit,
  severity = 'info',
  description,
  index = 0,
}: DiagnosticResultCardProps) {
  const config = severityConfig[severity]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-xl border-2 ${config.borderColor} ${config.bgColor} p-5 shadow-md hover:shadow-lg transition-shadow`}
    >
      {/* Severity indicator stripe */}
      <div
        className={`absolute top-0 left-0 w-1 h-full ${config.iconColor.replace('text-', 'bg-')}`}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Metric name */}
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {name}
          </h3>

          {/* Value and unit */}
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${config.textColor}`}>
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            {unit && (
              <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
                {unit}
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>

        {/* Severity icon */}
        <div className={`flex-shrink-0 ml-3 ${config.iconColor}`}>{config.icon}</div>
      </div>

      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-5 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, currentColor 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, currentColor 0%, transparent 50%)',
            'radial-gradient(circle at 0% 0%, currentColor 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  )
}
