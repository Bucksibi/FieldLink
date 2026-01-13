import { SystemType } from '../types'

interface SystemSelectorProps {
  value: SystemType | ''
  onChange: (systemType: SystemType) => void
}

const SYSTEM_TYPES: SystemType[] = [
  'Gas Split AC System',
  'Heat Pump Split System',
  'Gas Pack Unit',
  'Straight AC Pack Unit',
  'Dual Fuel Unit',
]

export default function SystemSelector({ value, onChange }: SystemSelectorProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="system-type"
        className="block text-sm font-medium text-gray-300"
      >
        System Type <span className="text-red-500">*</span>
      </label>
      <select
        id="system-type"
        value={value}
        onChange={(e) => onChange(e.target.value as SystemType)}
        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
        required
      >
        <option value="">Select system type...</option>
        {SYSTEM_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-700">
        Select the HVAC system type being diagnosed
      </p>
    </div>
  )
}
