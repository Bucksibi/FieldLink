# AI Service Layer Documentation

## Overview

The AI Service Layer (`aiService.ts`) handles communication with OpenRouter's API to provide intelligent HVAC diagnostic analysis. It accepts system readings, dynamically selected AI models, and optional refrigerant information to deliver comprehensive diagnostic results.

## Features

- **Dynamic Model Selection**: Runtime model selection from any OpenRouter-supported model
- **System Type Awareness**: Intelligent analysis based on 5 supported HVAC system types
- **Refrigerant Handling**: Optional refrigerant-specific diagnostics when applicable
- **Structured Output**: JSON-formatted results with performance metrics and fault detection
- **Comprehensive Error Handling**: Graceful degradation with detailed error messages
- **Request Logging**: Automatic logging of all diagnostic requests and results

## Supported System Types

1. **Gas Split AC System** - Split system with gas furnace heating and electric AC cooling
2. **Heat Pump Split System** - Reversible heat pump for both heating and cooling
3. **Gas Pack Unit** - Packaged unit with gas heating and electric cooling
4. **Straight AC Pack Unit** - Packaged AC unit with optional electric heat
5. **Dual Fuel Unit** - Hybrid heat pump + gas furnace system

## API Endpoints

### 1. Get System Types
```http
GET /api/system-types
```

**Response:**
```json
{
  "system_types": [
    "Gas Split AC System",
    "Heat Pump Split System",
    "Gas Pack Unit",
    "Straight AC Pack Unit",
    "Dual Fuel Unit"
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. AI Diagnostic Analysis
```http
POST /api/diagnostics/ai
Content-Type: application/json
```

**Request Body:**
```json
{
  "apiKey": "sk-or-v1-xxxxx",
  "modelId": "anthropic/claude-3.5-sonnet",
  "system_type": "Heat Pump Split System",
  "refrigerant": "R-410A",
  "readings_std": {
    "indoor_temp": 72,
    "outdoor_temp": 95,
    "supply_air_temp": 55,
    "return_air_temp": 75,
    "suction_pressure": 118,
    "discharge_pressure": 350,
    "liquid_line_temp": 95,
    "suction_line_temp": 50,
    "voltage": 240,
    "amperage": 15.2,
    "static_pressure": 0.5,
    "cfm": 1200
  },
  "user_notes": "Customer reports weak cooling on hot days"
}
```

**Required Fields:**
- `apiKey` - OpenRouter API key
- `modelId` - Model ID from OpenRouter (e.g., "anthropic/claude-3.5-sonnet", "openai/gpt-4", etc.)
- `system_type` - One of the 5 supported system types
- `readings_std` - Object containing system measurements

**Optional Fields:**
- `refrigerant` - Refrigerant type (e.g., "R-410A", "R-22", "R-32")
- `user_notes` - Additional context from technician

**Response:**
```json
{
  "status": "success",
  "system_status": "attention_needed",
  "faults": [
    {
      "severity": "warning",
      "component": "Refrigerant Circuit",
      "issue": "Low subcooling detected",
      "explanation": "Subcooling of 8°F is below optimal range of 10-15°F, indicating possible refrigerant undercharge or restriction in liquid line.",
      "recommended_action": "Check for refrigerant leaks, verify charge level, inspect liquid line filter drier for restrictions.",
      "confidence": 85
    }
  ],
  "metrics": {
    "delta_t": 20,
    "superheat": 12,
    "subcooling": 8,
    "approach_temp": 15,
    "efficiency_rating": "good"
  },
  "summary": "System is operating with adequate cooling but shows signs of slight refrigerant undercharge. Performance is acceptable but could be optimized with proper refrigerant charge adjustment.",
  "recommendations": [
    "Perform leak test on refrigerant circuit",
    "Verify refrigerant charge using superheat/subcooling method",
    "Clean condenser coil if dirty to improve heat rejection",
    "Monitor system performance after adjustments"
  ],
  "timestamp": "2024-01-01T12:00:00.000Z",
  "model_used": "anthropic/claude-3.5-sonnet"
}
```

## Usage Examples

### Example 1: Heat Pump Diagnostic with Refrigerant Data

```typescript
import { analyzeSystem } from './aiService'

const result = await analyzeSystem({
  apiKey: 'sk-or-v1-xxxxx',
  modelId: 'anthropic/claude-3.5-sonnet',
  system_type: 'Heat Pump Split System',
  refrigerant: 'R-410A',
  readings_std: {
    indoor_temp: 68,
    outdoor_temp: 35,
    supply_air_temp: 95,
    return_air_temp: 70,
    suction_pressure: 85,
    discharge_pressure: 280,
    liquid_line_temp: 80,
    suction_line_temp: 45,
    voltage: 240,
    amperage: 18.5
  }
})

console.log(result.summary)
console.log(`System Status: ${result.system_status}`)
console.log(`Faults Found: ${result.faults.length}`)
```

### Example 2: Gas Furnace Diagnostic (No Refrigerant)

```typescript
const result = await analyzeSystem({
  apiKey: 'sk-or-v1-xxxxx',
  modelId: 'openai/gpt-4-turbo',
  system_type: 'Gas Split AC System',
  refrigerant: null, // Not applicable for heating mode
  readings_std: {
    indoor_temp: 65,
    outdoor_temp: 25,
    supply_air_temp: 120,
    return_air_temp: 68,
    voltage: 120,
    amperage: 8.2,
    static_pressure: 0.6,
    cfm: 1400,
    runtime_minutes: 15
  },
  user_notes: 'System running but customer says not heating properly'
})
```

### Example 3: AC System with Minimal Data

```typescript
const result = await analyzeSystem({
  apiKey: 'sk-or-v1-xxxxx',
  modelId: 'google/gemini-pro',
  system_type: 'Straight AC Pack Unit',
  refrigerant: 'R-22',
  readings_std: {
    supply_air_temp: 58,
    return_air_temp: 76,
    outdoor_temp: 92,
    suction_pressure: 70,
    discharge_pressure: 300
  }
})

// AI will note limited data and suggest additional measurements
console.log(result.recommendations)
```

## Standard Readings Reference

### Temperature Readings (°F)
- `indoor_temp` - Indoor ambient temperature
- `outdoor_temp` - Outdoor ambient temperature
- `supply_air_temp` - Supply air temperature at register
- `return_air_temp` - Return air temperature
- `liquid_line_temp` - Liquid line temperature (high-pressure side)
- `suction_line_temp` - Suction line temperature (low-pressure side)

### Pressure Readings (PSIG)
- `suction_pressure` - Low-side pressure
- `discharge_pressure` - High-side pressure
- `liquid_line_pressure` - Liquid line pressure

### Electrical Readings
- `voltage` - Operating voltage (V)
- `amperage` - Current draw (A)

### Airflow Readings
- `static_pressure` - Static pressure (inches water column)
- `cfm` - Cubic feet per minute airflow

### Other Readings
- `runtime_minutes` - System runtime in minutes
- `filter_condition` - Filter condition: "clean", "dirty", "very_dirty"

### Custom Readings
You can add any custom readings as key-value pairs:
```typescript
readings_std: {
  supply_air_temp: 55,
  return_air_temp: 72,
  evaporator_coil_temp: 48,
  condenser_entering_air: 95,
  // ... any other custom measurements
}
```

## AI Prompt Design

The AI service automatically constructs intelligent prompts that:

1. **Provide System Context** - Detailed information about the specific HVAC system type
2. **Handle Refrigerant Logic** - Include or exclude refrigerant analysis based on availability
3. **Calculate Derived Metrics** - ΔT, superheat, subcooling, approach temperature, etc.
4. **Identify Faults** - Detect abnormal readings and potential issues
5. **Assess Severity** - Categorize issues as critical, warning, or informational
6. **Generate Recommendations** - Provide specific, actionable next steps

### System Prompt Structure
```
You are an expert HVAC diagnostic AI assistant...

System Type Being Analyzed: [specific type]

Key Responsibilities:
1. Calculate derived performance metrics
2. Identify potential faults and inefficiencies
3. Provide severity ratings for each issue
4. Offer specific, actionable recommendations
5. Consider system-specific characteristics

System Type Context: [detailed context about the specific system type]

[Refrigerant Analysis section if applicable, or note if not applicable]

Analysis Guidelines:
- Normal operating ranges
- Expected performance metrics
- Red flags and warning signs

Output Format: [Structured JSON specification]
```

## Error Handling

The service handles multiple error scenarios:

### 1. Missing API Key
```json
{
  "status": "error",
  "error_message": "API key is required",
  "system_status": "critical",
  "faults": [],
  "metrics": {},
  "summary": "Failed to analyze system",
  "recommendations": ["Please check API configuration and try again"]
}
```

### 2. Invalid System Type
```json
{
  "status": "error",
  "error_message": "Valid system type is required",
  "recommendations": ["Available system types: Gas Split AC System, Heat Pump Split System, ..."]
}
```

### 3. API Request Failure
```json
{
  "status": "error",
  "error_message": "OpenRouter API error (401): Invalid API key",
  "summary": "Failed to analyze system"
}
```

### 4. Malformed AI Response
The service attempts to parse JSON from AI responses. If parsing fails, it returns an error with details.

## Request Logging

All diagnostic requests are automatically logged to console:

```
[2024-01-01T12:00:00.000Z] AI Diagnostic Request: {
  modelId: 'anthropic/claude-3.5-sonnet',
  system_type: 'Heat Pump Split System',
  refrigerant: 'R-410A',
  readingCount: 12
}

[2024-01-01T12:00:05.000Z] AI Diagnostic Result: {
  status: 'success',
  system_status: 'attention_needed',
  faultCount: 2
}
```

## Model Selection

OpenRouter supports a wide range of models. Popular choices for HVAC diagnostics:

### High Performance (Most Accurate)
- `anthropic/claude-3-opus` - Best for complex diagnostics
- `anthropic/claude-3.5-sonnet` - Excellent balance of speed and accuracy
- `openai/gpt-4-turbo` - Strong technical reasoning

### Cost-Effective (Good Performance)
- `anthropic/claude-3-haiku` - Fast and affordable
- `openai/gpt-3.5-turbo` - Solid general purpose
- `google/gemini-pro` - Good value option

### Specialized
- `meta-llama/llama-3.1-70b-instruct` - Open source alternative
- `mistralai/mixtral-8x7b-instruct` - Fast inference

Choose based on your requirements for accuracy, speed, and cost.

## Best Practices

1. **Always Include Core Readings**: Supply temp, return temp, and outdoor temp are minimum requirements
2. **Provide Refrigerant Info When Available**: Enables more accurate charge analysis
3. **Add Technician Notes**: Context helps AI provide better recommendations
4. **Use Appropriate Models**: Match model capability to diagnostic complexity
5. **Validate Input Data**: Ensure readings are physically plausible before sending
6. **Handle Errors Gracefully**: Always check for `status: "error"` in responses
7. **Log for Debugging**: Use the built-in logging for troubleshooting

## Integration with Frontend

See `frontend/src/components/AIDiagnostic.tsx` for a complete React component example that integrates with this service.

## Security Considerations

- **Never store API keys in code** - Accept from user input or secure environment variables
- **Validate all inputs** - System type, model ID, and readings should be validated
- **Rate limiting** - Consider implementing rate limits for production deployments
- **Error message sanitization** - Don't expose internal errors to end users

## Performance

- Typical response time: 3-10 seconds (varies by model and complexity)
- Timeout: 30 seconds default (configurable)
- Token usage: ~1000-3000 tokens per request (varies by model)

## Future Enhancements

- Historical trend analysis
- Multi-system comparison
- Image analysis for visual diagnostics
- Automated report generation
- Integration with equipment databases
- Predictive maintenance scheduling
