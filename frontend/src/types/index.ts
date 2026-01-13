/**
 * Frontend type definitions
 */

export type SystemType =
  | 'Gas Split AC System'
  | 'Heat Pump Split System'
  | 'Gas Pack Unit'
  | 'Straight AC Pack Unit'
  | 'Dual Fuel Unit'

export type TroubleshootingMode = 'cooling' | 'heating' | 'both'

export type UnitType =
  | '°F'
  | '°C'
  | 'PSI'
  | 'kPa'
  | 'CFM'
  | 'L/s'
  | 'V'
  | 'A'
  | 'W'
  | 'in. w.c.'
  | 'text'
  | 'yes/no'

export interface Reading {
  id: string
  parameter: string
  value: string
  unit: UnitType
  isRequired?: boolean
  section?: string
}

export interface StandardReadings {
  [key: string]: number | string | undefined
}

export interface GeminiModel {
  id: string
  name: string
  description?: string
}

export interface DiagnosticFault {
  severity: 'critical' | 'warning' | 'info'
  component: string
  issue: string
  explanation: string
  recommended_action: string
  confidence?: number
}

export interface PerformanceMetrics {
  delta_t?: number
  superheat?: number
  subcooling?: number
  approach_temp?: number
  evaporator_td?: number
  condenser_td?: number
  seer_estimate?: number
  efficiency_rating?: 'excellent' | 'good' | 'fair' | 'poor'
  [key: string]: string | number | undefined
}

export interface DiagnosticResult {
  status: 'success' | 'error'
  system_status: 'normal' | 'attention_needed' | 'critical'
  faults: DiagnosticFault[]
  metrics: PerformanceMetrics
  summary: string
  recommendations: string[]
  timestamp: string
  model_used: string
  error_message?: string
}
