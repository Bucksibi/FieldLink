interface RefrigerantInputProps {
  value: string
  onChange: (refrigerant: string) => void
}

const COMMON_REFRIGERANTS = [
  'R-410A',
  'R-22',
  'R-32',
  'R-134a',
  'R-407C',
  'R-404A',
]

export default function RefrigerantInput({ value, onChange }: RefrigerantInputProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="refrigerant"
        className="block text-sm font-medium text-gray-300"
      >
        Refrigerant Type <span className="text-gray-400 text-xs">(optional)</span>
      </label>
      <div className="flex gap-2">
        <select
          id="refrigerant"
          value={COMMON_REFRIGERANTS.includes(value) ? value : 'custom'}
          onChange={(e) => {
            if (e.target.value !== 'custom') {
              onChange(e.target.value)
            } else {
              onChange('')
            }
          }}
          className="flex-1 px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
        >
          <option value="">Not specified</option>
          {COMMON_REFRIGERANTS.map((ref) => (
            <option key={ref} value={ref}>
              {ref}
            </option>
          ))}
          <option value="custom">Custom...</option>
        </select>
        {!COMMON_REFRIGERANTS.includes(value) && value !== '' && (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter refrigerant type"
            className="flex-1 px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
          />
        )}
      </div>
      <p className="text-xs text-gray-700">
        Leave blank if not applicable or unknown. AI will adjust analysis accordingly.
      </p>
    </div>
  )
}
