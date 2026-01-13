import { TroubleshootingMode } from '../types'

interface TroubleshootingModeSelectorProps {
  value: TroubleshootingMode
  onChange: (mode: TroubleshootingMode) => void
}

export default function TroubleshootingModeSelector({ value, onChange }: TroubleshootingModeSelectorProps) {
  const modes: { value: TroubleshootingMode; label: string; icon: string; color: string; description: string }[] = [
    {
      value: 'cooling',
      label: 'Cooling Issue',
      icon: '❄️',
      color: 'blue',
      description: 'Focus on refrigerant circuit, airflow, and electrical performance',
    },
    {
      value: 'heating',
      label: 'Heating Issue',
      icon: '🔥',
      color: 'red',
      description: 'Focus on furnace or heat pump heating operation',
    },
    {
      value: 'both',
      label: 'Both Heating & Cooling',
      icon: '🔄',
      color: 'orange',
      description: 'Complete full system diagnostics including all components',
    },
  ]

  return (
    <div className="space-y-3">
      <label className="block text-base font-semibold text-white">
        Troubleshooting Mode <span className="text-rose-500">*</span>
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modes.map((mode) => {
          const isSelected = value === mode.value

          const colorClasses = {
            blue: {
              border: 'border-blue-500',
              bg: 'bg-blue-900/30',
              ring: 'ring-blue-500',
              text: 'text-blue-300',
              hover: 'hover:border-blue-400 hover:bg-blue-900/20',
            },
            red: {
              border: 'border-red-500',
              bg: 'bg-red-900/30',
              ring: 'ring-red-500',
              text: 'text-red-300',
              hover: 'hover:border-red-400 hover:bg-red-900/20',
            },
            orange: {
              border: 'border-orange-500',
              bg: 'bg-orange-900/30',
              ring: 'ring-orange-500',
              text: 'text-orange-300',
              hover: 'hover:border-orange-400 hover:bg-orange-900/20',
            },
          }[mode.color] || {
            border: 'border-blue-500',
            bg: 'bg-blue-900/30',
            ring: 'ring-blue-500',
            text: 'text-blue-300',
            hover: 'hover:border-blue-400 hover:bg-blue-900/20',
          }

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange(mode.value)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isSelected
                  ? `${colorClasses.border} ${colorClasses.bg} ring-2 ${colorClasses.ring} ring-offset-2 ring-offset-gray-800`
                  : `border-slate-600 bg-slate-800/50 ${colorClasses.hover}`
                }
              `}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg className={`w-6 h-6 ${colorClasses.text}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Icon and Label */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{mode.icon}</span>
                <span className={`font-bold text-base ${isSelected ? colorClasses.text : 'text-gray-200'}`}>
                  {mode.label}
                </span>
              </div>

              {/* Description */}
              <p className={`text-xs ${isSelected ? colorClasses.text : 'text-gray-400'}`}>
                {mode.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Info Message Based on Selection */}
      {value && (
        <div className={`
          p-4 rounded-xl border-2 text-sm
          ${value === 'cooling'
            ? 'bg-blue-950/30 border-blue-800 text-blue-200'
            : value === 'heating'
            ? 'bg-red-950/30 border-red-800 text-red-200'
            : 'bg-orange-950/30 border-orange-800 text-orange-200'
          }
        `}>
          <div className="flex gap-2 items-start">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold mb-1">
                {value === 'cooling' && '🔵 Cooling Mode Selected'}
                {value === 'heating' && '🔴 Heating Mode Selected'}
                {value === 'both' && '🟠 Full System Check Selected'}
              </p>
              <p>
                {value === 'cooling' && 'Priority fields are highlighted below. Focus on refrigerant circuit, airflow, and electrical performance. You may also complete heating fields if performing a full system check.'}
                {value === 'heating' && 'Priority fields are highlighted below. Focus on furnace or heat pump heating operation. Cooling-related fields remain available for a full inspection.'}
                {value === 'both' && 'All fields are prioritized. Complete full system diagnostics including refrigerant, combustion, airflow, and electrical checks.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
