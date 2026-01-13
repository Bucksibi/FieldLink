/**
 * Unit conversion utilities for standardizing HVAC measurements
 */

import { UnitType } from '../types'

/**
 * Convert temperature to Fahrenheit
 */
export function convertToFahrenheit(value: number, fromUnit: UnitType): number {
  if (fromUnit === '°F') return value
  if (fromUnit === '°C') return (value * 9) / 5 + 32
  throw new Error(`Cannot convert ${fromUnit} to °F`)
}

/**
 * Convert pressure to PSI
 */
export function convertToPSI(value: number, fromUnit: UnitType): number {
  if (fromUnit === 'PSI') return value
  if (fromUnit === 'kPa') return value * 0.145038
  throw new Error(`Cannot convert ${fromUnit} to PSI`)
}

/**
 * Convert airflow to CFM
 */
export function convertToCFM(value: number, fromUnit: UnitType): number {
  if (fromUnit === 'CFM') return value
  if (fromUnit === 'L/s') return value * 2.11888
  throw new Error(`Cannot convert ${fromUnit} to CFM`)
}

/**
 * Standardize a reading value based on its unit
 * Returns the value in standard units used by the backend
 */
export function standardizeValue(value: number, unit: UnitType): number {
  // Temperature units -> convert to °F
  if (unit === '°F' || unit === '°C') {
    return convertToFahrenheit(value, unit)
  }

  // Pressure units -> convert to PSI
  if (unit === 'PSI' || unit === 'kPa') {
    return convertToPSI(value, unit)
  }

  // Airflow units -> convert to CFM
  if (unit === 'CFM' || unit === 'L/s') {
    return convertToCFM(value, unit)
  }

  // Electrical units (V, A, W) and other units -> no conversion needed
  return value
}

/**
 * Get the standard unit for a given unit type
 */
export function getStandardUnit(unit: UnitType): string {
  if (unit === '°F' || unit === '°C') return '°F'
  if (unit === 'PSI' || unit === 'kPa') return 'PSIG'
  if (unit === 'CFM' || unit === 'L/s') return 'CFM'
  if (unit === 'V') return 'V'
  if (unit === 'A') return 'A'
  if (unit === 'W') return 'W'
  if (unit === 'in. w.c.') return 'in. w.c.'
  return unit
}

/**
 * Normalize parameter name to match backend expectations
 */
export function normalizeParameterName(parameter: string): string {
  const normalized = parameter
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '')

  // Map common variations to standard names
  const mappings: Record<string, string> = {
    supply_temp: 'supply_air_temp',
    supply_temperature: 'supply_air_temp',
    return_temp: 'return_air_temp',
    return_temperature: 'return_air_temp',
    suction_temp: 'suction_line_temp',
    suction_temperature: 'suction_line_temp',
    liquid_temp: 'liquid_line_temp',
    liquid_temperature: 'liquid_line_temp',
    high_pressure: 'discharge_pressure',
    low_pressure: 'suction_pressure',
    high_side_pressure: 'discharge_pressure',
    low_side_pressure: 'suction_pressure',
    amps: 'amperage',
    current: 'amperage',
    volts: 'voltage',
  }

  return mappings[normalized] || normalized
}

/**
 * Validate if a value can be converted to a number
 */
export function isValidNumber(value: string): boolean {
  if (value.trim() === '') return false
  const num = Number(value)
  return !isNaN(num) && isFinite(num)
}

/**
 * Get available units based on parameter name
 */
export function getRelevantUnits(parameter: string): UnitType[] {
  const lower = parameter.toLowerCase()

  // Temperature parameters
  if (
    lower.includes('temp') ||
    lower.includes('temperature') ||
    lower.includes('air')
  ) {
    return ['°F', '°C']
  }

  // Pressure parameters
  if (lower.includes('pressure')) {
    return ['PSI', 'kPa']
  }

  // Airflow parameters
  if (
    lower.includes('cfm') ||
    lower.includes('airflow') ||
    lower.includes('flow')
  ) {
    return ['CFM', 'L/s']
  }

  // Electrical parameters
  if (lower.includes('voltage') || lower.includes('volt')) {
    return ['V']
  }

  if (lower.includes('amperage') || lower.includes('amp') || lower.includes('current')) {
    return ['A']
  }

  if (lower.includes('watt') || lower.includes('power')) {
    return ['W']
  }

  if (lower.includes('static')) {
    return ['in. w.c.']
  }

  // Default to all units
  return ['°F', '°C', 'PSI', 'kPa', 'CFM', 'L/s', 'V', 'A', 'W', 'in. w.c.']
}
