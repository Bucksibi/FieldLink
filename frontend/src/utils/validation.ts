/**
 * Validation utilities for HVAC diagnostic readings
 * Includes range checks, warnings, and field-specific validation
 */

import { UnitType } from '../types'

export interface ValidationResult {
  isValid: boolean
  error?: string
  warning?: string
  severity?: 'error' | 'warning' | 'info'
}

/**
 * HVAC-specific acceptable ranges for different parameters
 * Ranges are in standard units (°F, PSI, CFM, V, A, W, in. w.c.)
 */
const PARAMETER_RANGES: Record<string, {
  min: number
  max: number
  warningMin?: number
  warningMax?: number
  unit: string
}> = {
  // Temperature ranges (°F)
  'supply_air_temp': { min: -20, max: 200, warningMin: 40, warningMax: 140, unit: '°F' },
  'return_air_temp': { min: -20, max: 150, warningMin: 50, warningMax: 90, unit: '°F' },
  'outdoor_air_temp': { min: -40, max: 130, warningMin: -20, warningMax: 120, unit: '°F' },
  'indoor_air_temp': { min: 0, max: 120, warningMin: 55, warningMax: 85, unit: '°F' },
  'liquid_line_temp': { min: -40, max: 200, warningMin: 50, warningMax: 150, unit: '°F' },
  'suction_line_temp': { min: -40, max: 150, warningMin: 20, warningMax: 80, unit: '°F' },
  'discharge_temp': { min: 0, max: 250, warningMin: 100, warningMax: 220, unit: '°F' },
  'coil_temp': { min: -40, max: 200, warningMin: 20, warningMax: 120, unit: '°F' },
  'evaporator_temp': { min: -40, max: 100, warningMin: 20, warningMax: 60, unit: '°F' },
  'condenser_temp': { min: 0, max: 200, warningMin: 80, warningMax: 160, unit: '°F' },

  // Pressure ranges (PSI)
  'suction_pressure': { min: 0, max: 200, warningMin: 30, warningMax: 120, unit: 'PSI' },
  'discharge_pressure': { min: 0, max: 650, warningMin: 100, warningMax: 500, unit: 'PSI' },
  'liquid_line_pressure': { min: 0, max: 650, warningMin: 100, warningMax: 500, unit: 'PSI' },
  'gas_pressure': { min: 0, max: 100, warningMin: 3, warningMax: 15, unit: 'PSI' },
  'static_pressure': { min: 0, max: 5, warningMin: 0.2, warningMax: 1.5, unit: 'in. w.c.' },

  // Electrical ranges
  'voltage': { min: 0, max: 600, warningMin: 100, warningMax: 480, unit: 'V' },
  'amperage': { min: 0, max: 200, warningMin: 1, warningMax: 100, unit: 'A' },
  'wattage': { min: 0, max: 50000, warningMin: 100, warningMax: 20000, unit: 'W' },

  // Airflow ranges (CFM)
  'cfm': { min: 0, max: 10000, warningMin: 300, warningMax: 5000, unit: 'CFM' },
  'airflow': { min: 0, max: 10000, warningMin: 300, warningMax: 5000, unit: 'CFM' },

  // Calculated values
  'superheat': { min: -20, max: 100, warningMin: 5, warningMax: 25, unit: '°F' },
  'subcooling': { min: -20, max: 100, warningMin: 5, warningMax: 20, unit: '°F' },
  'delta_t': { min: 0, max: 50, warningMin: 14, warningMax: 24, unit: '°F' },
}

/**
 * Normalize parameter name for validation lookup
 */
function normalizeParameterForValidation(parameter: string): string {
  return parameter
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * Convert value to standard unit for validation
 */
function convertToStandardUnit(value: number, fromUnit: UnitType): { value: number; unit: string } {
  switch (fromUnit) {
    // Temperature conversions
    case '°C':
      return { value: (value * 9/5) + 32, unit: '°F' }
    case '°F':
      return { value, unit: '°F' }

    // Pressure conversions
    case 'kPa':
      return { value: value * 0.145038, unit: 'PSI' }
    case 'PSI':
      return { value, unit: 'PSI' }

    // Airflow conversions
    case 'L/s':
      return { value: value * 2.11888, unit: 'CFM' }
    case 'CFM':
      return { value, unit: 'CFM' }

    // Direct units
    case 'V':
      return { value, unit: 'V' }
    case 'A':
      return { value, unit: 'A' }
    case 'W':
      return { value, unit: 'W' }
    case 'in. w.c.':
      return { value, unit: 'in. w.c.' }

    default:
      return { value, unit: fromUnit }
  }
}

/**
 * Validate a numeric value is within acceptable range
 */
export function validateNumericValue(value: string): ValidationResult {
  if (!value.trim()) {
    return {
      isValid: false,
      error: 'Value is required',
      severity: 'error'
    }
  }

  const numValue = Number(value)

  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: 'Value must be a valid number',
      severity: 'error'
    }
  }

  if (!isFinite(numValue)) {
    return {
      isValid: false,
      error: 'Value must be finite',
      severity: 'error'
    }
  }

  return { isValid: true }
}

/**
 * Validate a reading against HVAC-specific ranges
 */
export function validateReading(
  parameter: string,
  value: string,
  unit: UnitType
): ValidationResult {
  // First check if value is numeric
  const numericValidation = validateNumericValue(value)
  if (!numericValidation.isValid) {
    return numericValidation
  }

  if (!parameter.trim()) {
    return {
      isValid: false,
      error: 'Parameter name is required',
      severity: 'error'
    }
  }

  const numValue = Number(value)
  const normalized = normalizeParameterForValidation(parameter)
  const range = PARAMETER_RANGES[normalized]

  if (!range) {
    // Parameter not in our validation database, just check it's a reasonable number
    if (numValue < -1000 || numValue > 1000000) {
      return {
        isValid: true,
        warning: 'Unusual value detected. Please verify this reading is correct.',
        severity: 'warning'
      }
    }
    return { isValid: true }
  }

  // Convert value to standard unit
  const converted = convertToStandardUnit(numValue, unit)

  // Check hard limits (absolute min/max)
  if (converted.value < range.min || converted.value > range.max) {
    return {
      isValid: false,
      error: `Value out of acceptable range (${range.min}-${range.max} ${range.unit})`,
      severity: 'error'
    }
  }

  // Check warning ranges (typical operating ranges)
  if (range.warningMin !== undefined && range.warningMax !== undefined) {
    if (converted.value < range.warningMin) {
      return {
        isValid: true,
        warning: `Value is below typical range (${range.warningMin}-${range.warningMax} ${range.unit}). System may have issues.`,
        severity: 'warning'
      }
    }
    if (converted.value > range.warningMax) {
      return {
        isValid: true,
        warning: `Value is above typical range (${range.warningMin}-${range.warningMax} ${range.unit}). System may have issues.`,
        severity: 'warning'
      }
    }
  }

  return { isValid: true }
}

/**
 * Get suggested unit for a parameter
 */
export function getSuggestedUnit(parameter: string): UnitType | null {
  const normalized = normalizeParameterForValidation(parameter)
  const range = PARAMETER_RANGES[normalized]

  if (!range) return null

  switch (range.unit) {
    case '°F': return '°F'
    case 'PSI': return 'PSI'
    case 'CFM': return 'CFM'
    case 'V': return 'V'
    case 'A': return 'A'
    case 'W': return 'W'
    case 'in. w.c.': return 'in. w.c.'
    default: return null
  }
}

/**
 * Check if a parameter name appears to be valid HVAC terminology
 */
export function validateParameterName(parameter: string): ValidationResult {
  if (!parameter.trim()) {
    return {
      isValid: false,
      error: 'Parameter name is required',
      severity: 'error'
    }
  }

  const normalized = normalizeParameterForValidation(parameter)

  // Check if it's a known parameter
  if (PARAMETER_RANGES[normalized]) {
    return { isValid: true }
  }

  // Check for common HVAC keywords
  const hvacKeywords = [
    'temp', 'temperature', 'pressure', 'voltage', 'amperage', 'amp', 'volt',
    'cfm', 'airflow', 'static', 'suction', 'discharge', 'liquid', 'gas',
    'supply', 'return', 'outdoor', 'indoor', 'coil', 'evaporator', 'condenser',
    'superheat', 'subcool', 'delta', 'approach', 'wattage', 'power', 'line'
  ]

  const hasHvacKeyword = hvacKeywords.some(keyword =>
    normalized.includes(keyword)
  )

  if (!hasHvacKeyword && parameter.trim().length > 3) {
    return {
      isValid: true,
      warning: 'Parameter name may not be standard HVAC terminology',
      severity: 'info'
    }
  }

  return { isValid: true }
}

/**
 * Validate all readings at once and return summary
 */
export function validateAllReadings(readings: Array<{
  parameter: string
  value: string
  unit: UnitType
}>): {
  isValid: boolean
  hasWarnings: boolean
  errorCount: number
  warningCount: number
  results: ValidationResult[]
} {
  let errorCount = 0
  let warningCount = 0

  const results = readings.map(reading => {
    const paramValidation = validateParameterName(reading.parameter)
    const valueValidation = validateReading(reading.parameter, reading.value, reading.unit)

    // Combine validations
    if (!paramValidation.isValid) {
      errorCount++
      return paramValidation
    }

    if (!valueValidation.isValid) {
      errorCount++
      return valueValidation
    }

    if (paramValidation.warning || valueValidation.warning) {
      warningCount++
      return {
        isValid: true,
        warning: paramValidation.warning || valueValidation.warning,
        severity: (paramValidation.severity || valueValidation.severity) as 'warning' | 'info'
      }
    }

    return { isValid: true }
  })

  return {
    isValid: errorCount === 0,
    hasWarnings: warningCount > 0,
    errorCount,
    warningCount,
    results
  }
}
