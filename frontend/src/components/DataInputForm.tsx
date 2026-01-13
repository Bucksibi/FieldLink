import { useState } from 'react'
import { Reading, UnitType, StandardReadings } from '../types'
import {
  standardizeValue,
  normalizeParameterName,
  isValidNumber,
  getRelevantUnits,
} from '../utils/unitConversion'
import {
  validateReading,
  validateParameterName,
  getSuggestedUnit,
  ValidationResult,
} from '../utils/validation'

interface DataInputFormProps {
  onChange: (readings: StandardReadings) => void
}

const ALL_UNITS: UnitType[] = ['°F', '°C', 'PSI', 'kPa', 'CFM', 'L/s', 'V', 'A', 'W', 'in. w.c.']

export default function DataInputForm({ onChange }: DataInputFormProps) {
  const [readings, setReadings] = useState<Reading[]>([
    { id: crypto.randomUUID(), parameter: '', value: '', unit: '°F' },
  ])
  const [validations, setValidations] = useState<Map<string, ValidationResult>>(new Map())

  const addReading = () => {
    const newReading: Reading = {
      id: crypto.randomUUID(),
      parameter: '',
      value: '',
      unit: '°F',
    }
    const updated = [...readings, newReading]
    setReadings(updated)
  }

  const removeReading = (id: string) => {
    const updated = readings.filter((r) => r.id !== id)
    setReadings(updated)
    updateStandardReadings(updated)
  }

  const updateReading = (id: string, field: keyof Reading, value: string) => {
    const updated = readings.map((r) => {
      if (r.id === id) {
        const updatedReading = { ...r, [field]: value }

        // Auto-suggest relevant units when parameter changes
        if (field === 'parameter' && value) {
          // First try the new validation-based suggestion
          const suggestedUnit = getSuggestedUnit(value)
          if (suggestedUnit && suggestedUnit !== r.unit) {
            updatedReading.unit = suggestedUnit
          } else {
            // Fallback to the existing method
            const relevantUnits = getRelevantUnits(value)
            if (relevantUnits.length > 0 && !relevantUnits.includes(r.unit)) {
              updatedReading.unit = relevantUnits[0]
            }
          }
        }

        return updatedReading
      }
      return r
    })
    setReadings(updated)
    updateStandardReadings(updated)
    validateReadings(updated)
  }

  // Increment/decrement value by appropriate step based on unit
  const adjustValue = (id: string, direction: 'increment' | 'decrement') => {
    const reading = readings.find((r) => r.id === id)
    if (!reading || !reading.value || !isValidNumber(reading.value)) return

    const currentValue = Number(reading.value)
    let step = 1

    // Adjust step size based on unit and magnitude
    if (reading.unit === 'PSI' || reading.unit === 'kPa') {
      step = Math.abs(currentValue) > 100 ? 5 : 1
    } else if (reading.unit === 'CFM' || reading.unit === 'L/s') {
      step = Math.abs(currentValue) > 1000 ? 50 : 10
    } else if (reading.unit === '°F' || reading.unit === '°C') {
      step = 1
    } else if (reading.unit === 'V') {
      step = Math.abs(currentValue) > 100 ? 10 : 1
    } else if (reading.unit === 'A') {
      step = Math.abs(currentValue) > 10 ? 1 : 0.1
    }

    const newValue = direction === 'increment' ? currentValue + step : currentValue - step
    const roundedValue = step < 1 ? newValue.toFixed(1) : Math.round(newValue).toString()

    updateReading(id, 'value', roundedValue)
  }

  const validateReadings = (currentReadings: Reading[]) => {
    const newValidations = new Map<string, ValidationResult>()

    currentReadings.forEach((reading) => {
      if (!reading.parameter.trim() && !reading.value.trim()) {
        // Empty reading, skip validation
        return
      }

      // Validate parameter name
      if (reading.parameter.trim()) {
        const paramValidation = validateParameterName(reading.parameter)
        if (!paramValidation.isValid || paramValidation.warning) {
          newValidations.set(`${reading.id}_param`, paramValidation)
        }
      }

      // Validate value
      if (reading.value.trim() && reading.parameter.trim()) {
        const valueValidation = validateReading(reading.parameter, reading.value, reading.unit)
        if (!valueValidation.isValid || valueValidation.warning) {
          newValidations.set(`${reading.id}_value`, valueValidation)
        }
      }
    })

    setValidations(newValidations)
  }

  const updateStandardReadings = (currentReadings: Reading[]) => {
    const standardized: StandardReadings = {}

    currentReadings.forEach((reading) => {
      if (reading.parameter.trim() && reading.value.trim() && isValidNumber(reading.value)) {
        const paramName = normalizeParameterName(reading.parameter)
        const numValue = Number(reading.value)
        const standardValue = standardizeValue(numValue, reading.unit)
        standardized[paramName] = standardValue
      }
    })

    onChange(standardized)
  }

  const getValidationStatus = (reading: Reading): 'valid' | 'invalid' | 'empty' | 'warning' => {
    if (!reading.parameter.trim() && !reading.value.trim()) return 'empty'
    if (!reading.parameter.trim()) return 'invalid'
    if (!reading.value.trim()) return 'invalid'
    if (!isValidNumber(reading.value)) return 'invalid'

    // Check for validation errors or warnings
    const paramValidation = validations.get(`${reading.id}_param`)
    const valueValidation = validations.get(`${reading.id}_value`)

    if (paramValidation && !paramValidation.isValid) return 'invalid'
    if (valueValidation && !valueValidation.isValid) return 'invalid'
    if (paramValidation?.warning || valueValidation?.warning) return 'warning'

    return 'valid'
  }

  const getValidationMessage = (reading: Reading): string | null => {
    const paramValidation = validations.get(`${reading.id}_param`)
    const valueValidation = validations.get(`${reading.id}_value`)

    if (valueValidation?.error) return valueValidation.error
    if (paramValidation?.error) return paramValidation.error
    if (valueValidation?.warning) return valueValidation.warning
    if (paramValidation?.warning) return paramValidation.warning

    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <label className="block text-base font-semibold text-gray-800 dark:text-gray-100">
          System Readings <span className="text-rose-500">*</span>
        </label>
        <button
          type="button"
          onClick={addReading}
          className="w-full sm:w-auto px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation"
          style={{ minHeight: '48px' }}
        >
          + Add Reading
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {readings.map((reading, index) => {
          const status = getValidationStatus(reading)
          const hasError = status === 'invalid'
          const hasWarning = status === 'warning'
          const validationMessage = getValidationMessage(reading)

          let borderColor = 'border-slate-200 bg-white dark:bg-slate-800/50 dark:border-slate-600'
          if (hasError) {
            borderColor = 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-600'
          } else if (hasWarning) {
            borderColor = 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600'
          } else if (status === 'valid') {
            borderColor = 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-700'
          }

          return (
            <div key={reading.id} className="space-y-2">
              <div className={`flex flex-col sm:flex-row gap-3 items-stretch p-4 rounded-lg border-2 ${borderColor} transition-colors`}>
              <div className="flex-1 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-3">
                {/* Parameter Name with inline validation */}
                <div className="relative">
                  <input
                    type="text"
                    value={reading.parameter}
                    onChange={(e) => updateReading(reading.id, 'parameter', e.target.value)}
                    placeholder="e.g., Supply Air Temp"
                    className={`w-full px-4 py-3 pr-10 border-2 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700/50 dark:text-white transition-all duration-200 ${
                      hasError && !reading.parameter.trim()
                        ? 'border-rose-400 dark:border-rose-500'
                        : status === 'valid' && reading.parameter.trim()
                        ? 'border-emerald-400 dark:border-emerald-600'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                    style={{ minHeight: '48px' }}
                  />
                  {/* Inline validation icon */}
                  {reading.parameter.trim() && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {status === 'valid' ? (
                        <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (hasError || hasWarning) && (
                        <svg className={`w-5 h-5 ${hasError ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                  {index === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Parameter name</p>
                  )}
                </div>

                {/* Value with steppers and unit label */}
                <div className="relative">
                  <div className="flex gap-1">
                    {/* Decrement button */}
                    <button
                      type="button"
                      onClick={() => adjustValue(reading.id, 'decrement')}
                      disabled={!reading.value || !isValidNumber(reading.value)}
                      className="w-12 h-12 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-200 hover:bg-slate-300 active:bg-slate-400 disabled:bg-slate-100 disabled:text-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-600 rounded-xl font-bold text-xl transition-all duration-200 touch-manipulation shadow-sm hover:shadow"
                      style={{ minWidth: '48px', minHeight: '48px' }}
                      title="Decrease value"
                    >
                      −
                    </button>

                    {/* Value input with unit label */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={reading.value}
                        onChange={(e) => updateReading(reading.id, 'value', e.target.value)}
                        placeholder="e.g., 55"
                        className={`w-full px-4 py-3 pr-16 border-2 rounded-xl text-base font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700/50 dark:text-white transition-all duration-200 ${
                          hasError && reading.value.trim() && !isValidNumber(reading.value)
                            ? 'border-rose-400 dark:border-rose-500'
                            : status === 'valid' && reading.value.trim()
                            ? 'border-emerald-400 dark:border-emerald-600'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                        style={{ minHeight: '48px' }}
                      />
                      {/* Unit label inside input */}
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 rounded-md pointer-events-none select-none">
                        {reading.unit}
                      </span>
                    </div>

                    {/* Increment button */}
                    <button
                      type="button"
                      onClick={() => adjustValue(reading.id, 'increment')}
                      disabled={!reading.value || !isValidNumber(reading.value)}
                      className="w-12 h-12 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-200 hover:bg-slate-300 active:bg-slate-400 disabled:bg-slate-100 disabled:text-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-600 rounded-xl font-bold text-xl transition-all duration-200 touch-manipulation shadow-sm hover:shadow"
                      style={{ minWidth: '48px', minHeight: '48px' }}
                      title="Increase value"
                    >
                      +
                    </button>
                  </div>
                  {index === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Value (use +/− to adjust)</p>
                  )}
                </div>

                {/* Unit selector - hidden on mobile, shows unit inside value input instead */}
                <div className="hidden md:block">
                  <select
                    value={reading.unit}
                    onChange={(e) => updateReading(reading.id, 'unit', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700/50 dark:text-white transition-all duration-200"
                    style={{ minHeight: '48px' }}
                  >
                    {ALL_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  {index === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Unit</p>
                  )}
                </div>
              </div>

              {/* Remove Button - larger touch target */}
              <button
                type="button"
                onClick={() => removeReading(reading.id)}
                disabled={readings.length === 1}
                className="w-full sm:w-12 h-12 flex items-center justify-center text-rose-600 hover:text-white hover:bg-rose-600 active:bg-rose-700 disabled:text-slate-400 disabled:bg-transparent disabled:cursor-not-allowed transition-all duration-200 rounded-xl touch-manipulation"
                style={{ minWidth: '48px', minHeight: '48px' }}
                title="Remove reading"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Validation Message */}
            {validationMessage && (
              <div
                className={`flex gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
                  hasError
                    ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                }`}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {hasError ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  )}
                </svg>
                <span>{validationMessage}</span>
              </div>
            )}
          </div>
          )
        })}
      </div>

      {/* Validation Summary */}
      {readings.some((r) => getValidationStatus(r) === 'invalid') && (
        <div className="flex gap-2 text-sm font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700 p-4 rounded-xl">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Please fix or remove invalid readings before running diagnostics.</span>
        </div>
      )}
      {readings.some((r) => getValidationStatus(r) === 'warning') && !readings.some((r) => getValidationStatus(r) === 'invalid') && (
        <div className="flex gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 p-4 rounded-xl">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Some readings are outside typical ranges. The system may have issues. You can still proceed with diagnostics.</span>
        </div>
      )}

      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <p>
          <strong className="text-slate-700 dark:text-slate-300">Common parameters:</strong> Supply Air Temp, Return Air Temp, Suction Pressure,
          Discharge Pressure, Liquid Line Temp, Suction Line Temp, Voltage, Amperage, CFM, Static
          Pressure
        </p>
        <p>
          All values are automatically converted to standard units (°F, PSI, CFM) for analysis.
        </p>
      </div>
    </div>
  )
}
