import { useState, useEffect } from 'react'
import { Reading, UnitType, StandardReadings, SystemType, TroubleshootingMode } from '../types'
import {
  standardizeValue,
  normalizeParameterName,
  isValidNumber,
} from '../utils/unitConversion'
import { getTemplateForSystem, isFieldPriority } from '../utils/systemFieldTemplates'

interface DataInputFormEnhancedProps {
  onChange: (readings: StandardReadings) => void
  systemType: SystemType | null
  troubleshootingMode: TroubleshootingMode | null
}

const NUMERIC_UNITS: UnitType[] = ['°F', '°C', 'PSI', 'kPa', 'CFM', 'L/s', 'V', 'A', 'W', 'in. w.c.']
const TEXT_UNITS: UnitType[] = ['text', 'yes/no']

export default function DataInputFormEnhanced({ onChange, systemType, troubleshootingMode }: DataInputFormEnhancedProps) {
  const [readings, setReadings] = useState<Reading[]>([])
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  // Load template when system type changes
  useEffect(() => {
    if (systemType) {
      const template = getTemplateForSystem(systemType)
      if (template) {
        const templateReadings: Reading[] = []

        template.sections.forEach(section => {
          section.fields.forEach(field => {
            templateReadings.push({
              id: crypto.randomUUID(),
              parameter: field.parameter,
              value: '',
              unit: field.unit as UnitType,
              isRequired: field.isRequired || false,
              section: section.name,
            })
          })
        })

        setReadings(templateReadings)
        // Start with all sections expanded
        setCollapsedSections(new Set())
      }
    } else {
      // No system type selected, show empty form
      setReadings([
        { id: crypto.randomUUID(), parameter: '', value: '', unit: '°F' },
      ])
    }
  }, [systemType])

  const toggleSection = (sectionName: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionName)) {
      newCollapsed.delete(sectionName)
    } else {
      newCollapsed.add(sectionName)
    }
    setCollapsedSections(newCollapsed)
  }

  const updateReading = (id: string, field: keyof Reading, value: string) => {
    const updated = readings.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: value }
      }
      return r
    })
    setReadings(updated)
    updateStandardReadings(updated)
  }

  const updateStandardReadings = (currentReadings: Reading[]) => {
    const standardized: StandardReadings = {}

    currentReadings.forEach((reading) => {
      if (reading.parameter.trim() && reading.value.trim()) {
        const paramName = normalizeParameterName(reading.parameter)

        // Handle numeric values
        if (NUMERIC_UNITS.includes(reading.unit) && isValidNumber(reading.value)) {
          const numValue = Number(reading.value)
          const standardValue = standardizeValue(numValue, reading.unit)
          standardized[paramName] = standardValue
        }
        // Handle text and yes/no values
        else if (TEXT_UNITS.includes(reading.unit)) {
          standardized[paramName] = reading.value
        }
      }
    })

    onChange(standardized)
  }

  // Group readings by section
  const groupedReadings = readings.reduce((acc, reading) => {
    const section = reading.section || 'Other'
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(reading)
    return acc
  }, {} as Record<string, Reading[]>)

  const sectionOrder = systemType && getTemplateForSystem(systemType)?.sections.map(s => s.name) || []
  const orderedSections = sectionOrder.filter(s => groupedReadings[s])

  const renderField = (reading: Reading) => {
    const isYesNo = reading.unit === 'yes/no'
    const isText = reading.unit === 'text'

    // Check if this field is a priority for the current mode
    const template = systemType ? getTemplateForSystem(systemType) : null
    const fieldTemplate = template?.sections
      .flatMap(s => s.fields)
      .find(f => f.parameter === reading.parameter)
    const isPriority = fieldTemplate ? isFieldPriority(fieldTemplate, troubleshootingMode) : true

    return (
      <div key={reading.id} className={`grid grid-cols-1 md:grid-cols-3 gap-3 items-start p-2 rounded-lg transition-colors ${
        isPriority ? '' : 'opacity-60'
      }`}>
        {/* Parameter Label */}
        <div className="flex items-center gap-2">
          {isPriority && troubleshootingMode && troubleshootingMode !== 'both' && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" title="Priority field for selected mode" />
          )}
          <label className="text-sm font-medium text-gray-300">
            {reading.parameter}
            {reading.isRequired && <span className="text-rose-500 ml-1">*</span>}
          </label>
        </div>

        {/* Value Input */}
        <div className="md:col-span-2">
          {isYesNo ? (
            <select
              value={reading.value}
              onChange={(e) => updateReading(reading.id, 'value', e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-600 rounded-lg text-base text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="N/A">N/A</option>
            </select>
          ) : isText ? (
            <input
              type="text"
              value={reading.value}
              onChange={(e) => updateReading(reading.id, 'value', e.target.value)}
              placeholder={getPlaceholder(reading.parameter)}
              className="w-full px-4 py-2.5 border-2 border-gray-600 rounded-lg text-base text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={reading.value}
                onChange={(e) => updateReading(reading.id, 'value', e.target.value)}
                placeholder="0"
                className="flex-1 px-4 py-2.5 border-2 border-gray-600 rounded-lg text-base font-semibold text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <span className="px-3 py-2.5 text-sm font-bold text-slate-300 bg-slate-600 rounded-lg min-w-[60px] text-center">
                {reading.unit}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!systemType) {
    return (
      <div className="p-6 bg-blue-50 border-2 border-blue-300 rounded-xl">
        <div className="flex gap-3 items-start">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-base font-semibold text-black mb-1">
              Select System Type First
            </h3>
            <p className="text-sm text-black">
              Please select an HVAC system type above to load the appropriate data collection form with pre-populated fields.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-base font-semibold text-white">
          System Readings
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCollapsedSections(new Set(orderedSections))}
            className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Collapse All
          </button>
          <button
            type="button"
            onClick={() => setCollapsedSections(new Set())}
            className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Expand All
          </button>
        </div>
      </div>

      {/* Render sections */}
      <div className="space-y-3">
        {orderedSections.map((sectionName) => {
          const sectionReadings = groupedReadings[sectionName]
          const isCollapsed = collapsedSections.has(sectionName)
          const filledCount = sectionReadings.filter(r => r.value.trim()).length
          const totalCount = sectionReadings.length
          const requiredCount = sectionReadings.filter(r => r.isRequired).length
          const filledRequiredCount = sectionReadings.filter(r => r.isRequired && r.value.trim()).length

          return (
            <div
              key={sectionName}
              className="border-2 border-slate-700 rounded-xl overflow-hidden bg-slate-800/50"
            >
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(sectionName)}
                className="w-full px-5 py-3.5 flex justify-between items-center bg-gradient-to-r from-slate-800 to-slate-750 hover:from-slate-750 hover:to-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <h3 className="text-base font-bold text-white">
                    {sectionName}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  {requiredCount > 0 && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                      filledRequiredCount === requiredCount
                        ? 'bg-green-900/40 text-green-300'
                        : 'bg-amber-900/40 text-amber-300'
                    }`}>
                      {filledRequiredCount}/{requiredCount} required
                    </span>
                  )}
                  <span className="text-xs font-medium text-slate-400 bg-slate-700 px-2 py-1 rounded-md">
                    {filledCount}/{totalCount} filled
                  </span>
                </div>
              </button>

              {/* Section Content */}
              {!isCollapsed && (
                <div className="px-5 py-4 space-y-3 bg-slate-800/30">
                  {sectionReadings.map(renderField)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info Box */}
      <div className="text-xs text-slate-300 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <p className="font-medium mb-1">
          <span className="text-rose-500">*</span> = Required field
        </p>
        <p>
          Fill in as many fields as possible for the most accurate diagnostic. Required fields must be completed to run the analysis.
        </p>
      </div>
    </div>
  )
}

function getPlaceholder(parameterName: string): string {
  const placeholders: Record<string, string> = {
    'Outdoor Model #': 'e.g., ABC-1234',
    'Indoor Model #': 'e.g., XYZ-5678',
    'Refrigerant Type': 'e.g., R-410A',
    'Gas Type': 'Natural or LP',
    'Filter Condition': 'Clean/Dirty/Replace',
    'Electrical Connections': 'Pass/Fail',
    'Thermostat Operation': 'Pass/Fail',
    'System Age': 'Years',
    'System Capacity': 'Tons',
    'Capacity': 'Tons',
    'Relative Humidity': '%',
    'Flame Sensor': 'µA',
    'CO': 'ppm',
  }
  return placeholders[parameterName] || ''
}
