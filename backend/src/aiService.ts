import {
  DiagnosticRequest,
  DiagnosticResult,
  GeminiRequest,
  GeminiResponse,
  SystemType,
  StandardReadings,
} from './types.js'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Builds the system prompt for HVAC diagnostic AI
 */
function buildSystemPrompt(systemType: SystemType, hasRefrigerant: boolean): string {
  return `You are an expert HVAC diagnostic AI assistant with deep knowledge of residential and commercial HVAC systems.

Your task is to analyze HVAC system readings and provide accurate diagnostic assessments.

**System Type Being Analyzed:** ${systemType}

**Key Responsibilities:**
1. Calculate derived performance metrics (ΔT, superheat, subcooling, approach temperature, etc.) from the provided readings
2. Identify potential faults, inefficiencies, or abnormal operating conditions
3. Provide severity ratings (critical, warning, info) for each identified issue
4. Offer specific, actionable recommendations for technicians
5. Consider the specific characteristics of the system type when analyzing

**System Type Context:**
${getSystemTypeContext(systemType)}

${hasRefrigerant ? `**Refrigerant Analysis:**
- Use refrigerant-specific pressure-temperature relationships
- Calculate superheat and subcooling based on refrigerant properties
- Consider refrigerant charge level indicators
- Evaluate system efficiency based on refrigerant circuit performance` : `**Note:** Refrigerant information not provided or not applicable for this analysis. Focus on temperature differentials, airflow, and electrical readings.`}

**Analysis Guidelines:**
- Normal cooling ΔT (supply-return): 18-22°F for AC systems
- Normal heating ΔT: 30-50°F for heat pumps/furnaces
- Typical superheat range: 8-15°F (varies by system and conditions)
- Typical subcooling range: 10-15°F (varies by system and conditions)
- Consider outdoor ambient conditions in your analysis
- Flag any readings that are outside normal operating ranges
- Provide confidence levels when calculations depend on incomplete data

**CRITICAL - Output Format:**
You MUST return ONLY valid JSON. Do not include any markdown, explanations, or text outside the JSON object.

Return this exact structure:
{
  "system_status": "normal",
  "faults": [
    {
      "severity": "warning",
      "component": "Refrigerant Circuit",
      "issue": "Low subcooling detected",
      "explanation": "Subcooling of 8F is below optimal range indicating possible undercharge",
      "recommended_action": "Check for refrigerant leaks and verify charge level",
      "confidence": 85
    }
  ],
  "metrics": {
    "delta_t": 20,
    "superheat": 12,
    "subcooling": 8,
    "efficiency_rating": "good"
  },
  "summary": "System operating adequately but shows signs of slight refrigerant undercharge. Performance is acceptable but could be optimized.",
  "recommendations": ["Perform leak test", "Verify refrigerant charge", "Monitor performance"]
}

RULES:
- Return ONLY the JSON object, nothing else
- All string values must be properly escaped
- Use double quotes for all strings
- Do not include any newlines within string values
- Ensure all JSON is valid and parseable
- If a metric cannot be calculated, use null not a string

Be thorough, accurate, and practical in your analysis. When data is insufficient, acknowledge limitations in the summary.`
}

/**
 * Provides system-specific context for AI analysis
 */
function getSystemTypeContext(systemType: SystemType): string {
  const contexts: Record<SystemType, string> = {
    'Gas Split AC System': `This is a split system with a gas furnace for heating and electric AC for cooling.
- Outdoor condensing unit contains compressor and condenser coil
- Indoor unit contains evaporator coil and gas furnace
- When in cooling mode, focus on refrigerant circuit and airflow
- When in heating mode, focus on gas valve operation, heat exchanger, and combustion efficiency`,

    'Heat Pump Split System': `This is a reversible heat pump system that provides both heating and cooling.
- Can reverse refrigerant flow for heating mode
- Outdoor unit contains compressor and coil that acts as condenser (cooling) or evaporator (heating)
- Indoor unit contains coil that acts as evaporator (cooling) or condenser (heating)
- Defrost cycle operation is critical in heating mode
- Check for proper reversing valve operation
- Heating efficiency drops with outdoor temperature`,

    'Gas Pack Unit': `This is a packaged unit containing both gas heating and electric cooling in one cabinet.
- All components in single outdoor unit
- Gas furnace and AC compressor share the same cabinet
- Return air enters unit, conditioned air supplied to building
- Check for proper airflow through combined heat exchanger and evaporator
- Monitor flue gas venting and combustion air intake`,

    'Straight AC Pack Unit': `This is a packaged air conditioning unit with electric heat or no heating.
- All cooling components in single outdoor cabinet
- May include electric resistance heat strips
- Simpler refrigerant circuit than split systems
- Focus on compressor, condenser, and evaporator performance
- Check condenser coil cleanliness and fan operation`,

    'Dual Fuel Unit': `This is a hybrid system combining heat pump and gas furnace for optimal efficiency.
- Heat pump provides primary heating and all cooling
- Gas furnace provides backup/supplemental heat in extreme cold
- Automatic switchover based on outdoor temperature or efficiency
- Most complex system type requiring analysis of both heat pump and furnace operation
- Check switchover logic and both heating sources`,
  }

  return contexts[systemType] || 'Unknown system type - perform general HVAC analysis'
}

/**
 * Builds the user message with system readings
 */
function buildUserMessage(
  systemType: SystemType,
  refrigerant: string | null | undefined,
  readings: StandardReadings,
  userNotes?: string
): string {
  let message = `Please analyze the following HVAC system:\n\n`
  message += `**System Type:** ${systemType}\n`

  if (refrigerant) {
    message += `**Refrigerant Type:** ${refrigerant}\n`
  }

  message += `\n**System Readings:**\n`

  // Temperature readings
  const temps: string[] = []
  if (readings.indoor_temp !== undefined) temps.push(`Indoor Temp: ${readings.indoor_temp}°F`)
  if (readings.outdoor_temp !== undefined) temps.push(`Outdoor Temp: ${readings.outdoor_temp}°F`)
  if (readings.supply_air_temp !== undefined) temps.push(`Supply Air: ${readings.supply_air_temp}°F`)
  if (readings.return_air_temp !== undefined) temps.push(`Return Air: ${readings.return_air_temp}°F`)
  if (readings.liquid_line_temp !== undefined) temps.push(`Liquid Line: ${readings.liquid_line_temp}°F`)
  if (readings.suction_line_temp !== undefined) temps.push(`Suction Line: ${readings.suction_line_temp}°F`)
  if (temps.length > 0) message += `\nTemperatures:\n${temps.map(t => `- ${t}`).join('\n')}\n`

  // Pressure readings
  const pressures: string[] = []
  if (readings.suction_pressure !== undefined) pressures.push(`Suction: ${readings.suction_pressure} PSIG`)
  if (readings.discharge_pressure !== undefined) pressures.push(`Discharge: ${readings.discharge_pressure} PSIG`)
  if (readings.liquid_line_pressure !== undefined) pressures.push(`Liquid Line: ${readings.liquid_line_pressure} PSIG`)
  if (pressures.length > 0) message += `\nPressures:\n${pressures.map(p => `- ${p}`).join('\n')}\n`

  // Electrical readings
  const electrical: string[] = []
  if (readings.voltage !== undefined) electrical.push(`Voltage: ${readings.voltage}V`)
  if (readings.amperage !== undefined) electrical.push(`Amperage: ${readings.amperage}A`)
  if (electrical.length > 0) message += `\nElectrical:\n${electrical.map(e => `- ${e}`).join('\n')}\n`

  // Airflow readings
  const airflow: string[] = []
  if (readings.static_pressure !== undefined) airflow.push(`Static Pressure: ${readings.static_pressure} in. w.c.`)
  if (readings.cfm !== undefined) airflow.push(`CFM: ${readings.cfm}`)
  if (airflow.length > 0) message += `\nAirflow:\n${airflow.map(a => `- ${a}`).join('\n')}\n`

  // Other readings
  const other: string[] = []
  if (readings.runtime_minutes !== undefined) other.push(`Runtime: ${readings.runtime_minutes} minutes`)
  if (readings.filter_condition !== undefined) other.push(`Filter Condition: ${readings.filter_condition}`)
  if (other.length > 0) message += `\nOther:\n${other.map(o => `- ${o}`).join('\n')}\n`

  // Custom readings (anything not in standard fields)
  const standardKeys = [
    'indoor_temp', 'outdoor_temp', 'supply_air_temp', 'return_air_temp', 'liquid_line_temp', 'suction_line_temp',
    'suction_pressure', 'discharge_pressure', 'liquid_line_pressure',
    'voltage', 'amperage', 'static_pressure', 'cfm', 'runtime_minutes', 'filter_condition'
  ]
  const customReadings = Object.entries(readings)
    .filter(([key]) => !standardKeys.includes(key))
    .map(([key, value]) => `- ${key}: ${value}`)
  if (customReadings.length > 0) {
    message += `\nAdditional Readings:\n${customReadings.join('\n')}\n`
  }

  if (userNotes) {
    message += `\n**Technician Notes:** ${userNotes}\n`
  }

  message += `\n**Please provide a comprehensive diagnostic analysis in the specified JSON format.**`

  return message
}

/**
 * Calls Gemini API with the diagnostic request
 */
async function callGeminiAPI(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  userMessage: string
): Promise<GeminiResponse> {
  const requestBody: GeminiRequest = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ],
    generationConfig: {
      temperature: 0.3, // Lower temperature for more consistent technical analysis
      maxOutputTokens: 4000,
      responseMimeType: 'application/json',
    },
  }

  const apiUrl = `${GEMINI_API_BASE}/${modelId}:generateContent`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorText}`)
  }

  const data = await response.json() as GeminiResponse
  return data
}

/**
 * Parses and validates the AI response from Gemini
 */
function parseGeminiResponse(response: GeminiResponse, modelId: string): DiagnosticResult {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No response candidates returned from Gemini')
  }

  const candidate = response.candidates[0]
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw new Error('Empty response content from Gemini')
  }

  let content = candidate.content.parts[0].text || ''

  try {
    // Try to extract JSON if it's wrapped in markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (jsonMatch) {
      content = jsonMatch[1]
    }

    // Clean up common JSON issues
    content = content
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\n/g, ' ') // Replace newlines with spaces in strings
      .trim()

    const parsed = JSON.parse(content)

    // Validate required fields and provide defaults
    const system_status = parsed.system_status || 'attention_needed'
    const faults = Array.isArray(parsed.faults) ? parsed.faults : []
    const metrics = parsed.metrics || {}
    const summary = parsed.summary || 'Diagnostic analysis completed. See details below.'
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Review system readings and consult HVAC technician']

    // Construct the diagnostic result
    const result: DiagnosticResult = {
      status: 'success',
      system_status,
      faults,
      metrics,
      summary,
      recommendations,
      timestamp: new Date().toISOString(),
      model_used: modelId,
    }

    return result
  } catch (error) {
    // Log the problematic content for debugging
    console.error('Failed to parse Gemini response. Content:', content.substring(0, 500))
    throw new Error(`Failed to parse Gemini response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Main function to analyze HVAC system using Gemini AI
 */
export async function analyzeSystem(request: DiagnosticRequest): Promise<DiagnosticResult> {
  try {
    // Validate inputs
    if (!request.apiKey) {
      throw new Error('API key is required')
    }

    if (!request.modelId) {
      throw new Error('Model ID is required')
    }

    if (!request.system_type) {
      throw new Error('System type is required')
    }

    if (!request.readings_std || Object.keys(request.readings_std).length === 0) {
      throw new Error('System readings are required')
    }

    // Build prompts
    const hasRefrigerant = Boolean(request.refrigerant)
    const systemPrompt = buildSystemPrompt(request.system_type, hasRefrigerant)
    const userMessage = buildUserMessage(
      request.system_type,
      request.refrigerant,
      request.readings_std,
      request.user_notes
    )

    // Call Gemini API
    const apiResponse = await callGeminiAPI(
      request.apiKey,
      request.modelId,
      systemPrompt,
      userMessage
    )

    // Parse and return result
    const result = parseGeminiResponse(apiResponse, request.modelId)
    return result

  } catch (error) {
    // Return error result
    return {
      status: 'error',
      system_status: 'critical',
      faults: [],
      metrics: {},
      summary: 'Failed to analyze system',
      recommendations: ['Please check API configuration and try again'],
      timestamp: new Date().toISOString(),
      model_used: request.modelId || 'unknown',
      error_message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Helper function to validate system type
 */
export function isValidSystemType(type: string): type is SystemType {
  const validTypes: SystemType[] = [
    'Gas Split AC System',
    'Heat Pump Split System',
    'Gas Pack Unit',
    'Straight AC Pack Unit',
    'Dual Fuel Unit',
  ]
  return validTypes.includes(type as SystemType)
}

/**
 * Helper function to get available system types
 */
export function getAvailableSystemTypes(): SystemType[] {
  return [
    'Gas Split AC System',
    'Heat Pump Split System',
    'Gas Pack Unit',
    'Straight AC Pack Unit',
    'Dual Fuel Unit',
  ]
}

/**
 * Get available Gemini models
 */
export function getAvailableModels(): { id: string; name: string; description: string }[] {
  return [
    {
      id: 'gemini-3-flash-preview',
      name: 'Gemini 3 Flash (Preview)',
      description: 'Latest and fastest model with 1M context window - FREE'
    },
    {
      id: 'gemini-2.5-flash-preview-05-20',
      name: 'Gemini 2.5 Flash',
      description: 'Fast and efficient with excellent reasoning - FREE'
    },
    {
      id: 'gemini-2.5-pro-preview-05-06',
      name: 'Gemini 2.5 Pro',
      description: 'Best quality for complex tasks - FREE'
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Stable release with multimodal support - FREE'
    },
  ]
}
