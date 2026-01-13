/**
 * HVAC System Types
 */
export type SystemType =
  | 'Gas Split AC System'
  | 'Heat Pump Split System'
  | 'Gas Pack Unit'
  | 'Straight AC Pack Unit'
  | 'Dual Fuel Unit'

/**
 * Common refrigerant types
 */
export type RefrigerantType = 'R-410A' | 'R-22' | 'R-32' | 'R-134a' | string

/**
 * Standardized HVAC readings from sensors/gauges
 */
export interface StandardReadings {
  // Temperature readings (°F)
  indoor_temp?: number
  outdoor_temp?: number
  supply_air_temp?: number
  return_air_temp?: number
  liquid_line_temp?: number
  suction_line_temp?: number

  // Pressure readings (PSIG)
  suction_pressure?: number
  discharge_pressure?: number
  liquid_line_pressure?: number

  // Electrical readings
  voltage?: number
  amperage?: number

  // Airflow and other metrics
  static_pressure?: number
  cfm?: number

  // Additional context
  runtime_minutes?: number
  filter_condition?: 'clean' | 'dirty' | 'very_dirty'

  // Custom readings (key-value pairs for flexibility)
  [key: string]: string | number | undefined
}

/**
 * AI diagnostic analysis request
 */
export interface DiagnosticRequest {
  apiKey: string
  modelId: string
  location_address?: string
  equipment_model?: string
  equipment_serial?: string
  system_type: SystemType
  refrigerant?: RefrigerantType | null
  readings_std: StandardReadings
  user_notes?: string
}

/**
 * Diagnostic fault/issue identified by AI
 */
export interface DiagnosticFault {
  severity: 'critical' | 'warning' | 'info'
  component: string
  issue: string
  explanation: string
  recommended_action: string
  confidence?: number
}

/**
 * Calculated performance metrics
 */
export interface PerformanceMetrics {
  delta_t?: number // Supply - Return temperature difference
  superheat?: number
  subcooling?: number
  approach_temp?: number
  evaporator_td?: number
  condenser_td?: number
  seer_estimate?: number
  efficiency_rating?: 'excellent' | 'good' | 'fair' | 'poor'
  [key: string]: string | number | undefined
}

/**
 * AI diagnostic analysis result
 */
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

/**
 * Gemini API request structure
 * Based on: https://ai.google.dev/gemini-api/docs
 */
export interface GeminiRequest {
  contents: Array<{
    role?: 'user' | 'model'
    parts: Array<{
      text?: string
      inlineData?: {
        mimeType: string
        data: string // Base64 encoded
      }
    }>
  }>
  system_instruction?: {
    parts: Array<{ text: string }>
  }
  generationConfig?: {
    temperature?: number
    maxOutputTokens?: number
    responseMimeType?: string
    responseJsonSchema?: object
  }
}

/**
 * Gemini API response structure
 */
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string
      }>
      role: string
    }
    finishReason: string
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

/**
 * Gemini streaming chunk structure
 */
export interface GeminiStreamChunk {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
    }
  }>
}

/**
 * Available Gemini models
 */
export interface GeminiModel {
  id: string
  name: string
  description?: string
}
