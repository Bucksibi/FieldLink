/**
 * Example usage of the AI Service Layer for HVAC Diagnostics
 *
 * This file demonstrates various use cases for the analyzeSystem function
 */

import { analyzeSystem } from './src/aiService.js'
import { DiagnosticRequest } from './src/types.js'

// ============================================================================
// Example 1: Complete Heat Pump Diagnostic with All Readings
// ============================================================================

async function example1_FullHeatPumpDiagnostic() {
  console.log('\n=== Example 1: Full Heat Pump Diagnostic ===\n')

  const request: DiagnosticRequest = {
    apiKey: 'sk-or-v1-your-api-key-here',
    modelId: 'anthropic/claude-3.5-sonnet',
    system_type: 'Heat Pump Split System',
    refrigerant: 'R-410A',
    readings_std: {
      // Temperature readings
      indoor_temp: 72,
      outdoor_temp: 95,
      supply_air_temp: 55,
      return_air_temp: 75,
      liquid_line_temp: 95,
      suction_line_temp: 50,

      // Pressure readings
      suction_pressure: 118,
      discharge_pressure: 350,

      // Electrical readings
      voltage: 240,
      amperage: 15.2,

      // Airflow readings
      static_pressure: 0.5,
      cfm: 1200,

      // Other
      runtime_minutes: 30,
      filter_condition: 'clean',
    },
    user_notes: 'Customer reports system takes longer to cool on hot days',
  }

  try {
    const result = await analyzeSystem(request)

    console.log(`Status: ${result.status}`)
    console.log(`System Status: ${result.system_status}`)
    console.log(`Model Used: ${result.model_used}`)
    console.log(`\nSummary:\n${result.summary}`)

    console.log(`\nPerformance Metrics:`)
    console.log(`- Delta T: ${result.metrics.delta_t}°F`)
    console.log(`- Superheat: ${result.metrics.superheat}°F`)
    console.log(`- Subcooling: ${result.metrics.subcooling}°F`)
    console.log(`- Efficiency: ${result.metrics.efficiency_rating}`)

    if (result.faults.length > 0) {
      console.log(`\nFaults Detected (${result.faults.length}):`)
      result.faults.forEach((fault, idx) => {
        console.log(`\n${idx + 1}. [${fault.severity.toUpperCase()}] ${fault.component}`)
        console.log(`   Issue: ${fault.issue}`)
        console.log(`   Action: ${fault.recommended_action}`)
      })
    }

    console.log(`\nRecommendations:`)
    result.recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec}`)
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

// ============================================================================
// Example 2: Gas Furnace Diagnostic (No Refrigerant)
// ============================================================================

async function example2_GasFurnaceDiagnostic() {
  console.log('\n=== Example 2: Gas Furnace Diagnostic ===\n')

  const request: DiagnosticRequest = {
    apiKey: 'sk-or-v1-your-api-key-here',
    modelId: 'openai/gpt-4-turbo',
    system_type: 'Gas Split AC System',
    refrigerant: null, // Not applicable in heating mode
    readings_std: {
      indoor_temp: 65,
      outdoor_temp: 25,
      supply_air_temp: 120,
      return_air_temp: 68,
      voltage: 120,
      amperage: 8.2,
      static_pressure: 0.6,
      cfm: 1400,
      runtime_minutes: 15,
      filter_condition: 'dirty',
    },
    user_notes: 'Customer complains of weak heating, furnace cycles frequently',
  }

  try {
    const result = await analyzeSystem(request)

    console.log(`Status: ${result.status}`)
    console.log(`System Status: ${result.system_status}`)
    console.log(`\nSummary:\n${result.summary}`)

    if (result.faults.length > 0) {
      console.log(`\nIssues Found:`)
      result.faults.forEach(fault => {
        console.log(`- [${fault.severity}] ${fault.issue}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

// ============================================================================
// Example 3: Minimal Data Scenario
// ============================================================================

async function example3_MinimalDataDiagnostic() {
  console.log('\n=== Example 3: Minimal Data Diagnostic ===\n')

  const request: DiagnosticRequest = {
    apiKey: 'sk-or-v1-your-api-key-here',
    modelId: 'anthropic/claude-3-haiku', // Faster, more cost-effective model
    system_type: 'Straight AC Pack Unit',
    refrigerant: 'R-22',
    readings_std: {
      supply_air_temp: 58,
      return_air_temp: 76,
      outdoor_temp: 92,
    },
    user_notes: 'Quick check during service call, limited gauge access',
  }

  try {
    const result = await analyzeSystem(request)

    console.log(`Status: ${result.status}`)
    console.log(`\nWith limited data, AI suggests:`)
    result.recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec}`)
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

// ============================================================================
// Example 4: Dual Fuel System in Heating Mode
// ============================================================================

async function example4_DualFuelHeating() {
  console.log('\n=== Example 4: Dual Fuel System Heating ===\n')

  const request: DiagnosticRequest = {
    apiKey: 'sk-or-v1-your-api-key-here',
    modelId: 'anthropic/claude-3.5-sonnet',
    system_type: 'Dual Fuel Unit',
    refrigerant: 'R-410A',
    readings_std: {
      indoor_temp: 68,
      outdoor_temp: 15, // Very cold - may trigger gas backup
      supply_air_temp: 110,
      return_air_temp: 70,
      suction_pressure: 45, // Low due to cold outdoor temp
      discharge_pressure: 180,
      voltage: 240,
      amperage: 22.5, // Higher draw possible with aux heat
      runtime_minutes: 45,
    },
    user_notes: 'System appears to be using both heat pump and gas backup',
  }

  try {
    const result = await analyzeSystem(request)

    console.log(`Status: ${result.status}`)
    console.log(`System Status: ${result.system_status}`)
    console.log(`\nSummary:\n${result.summary}`)
    console.log(`\nMetrics:`)
    console.log(JSON.stringify(result.metrics, null, 2))

  } catch (error) {
    console.error('Error:', error)
  }
}

// ============================================================================
// Example 5: Pack Unit with Performance Issues
// ============================================================================

async function example5_PackUnitWithIssues() {
  console.log('\n=== Example 5: Pack Unit Performance Issues ===\n')

  const request: DiagnosticRequest = {
    apiKey: 'sk-or-v1-your-api-key-here',
    modelId: 'openai/gpt-4-turbo',
    system_type: 'Gas Pack Unit',
    refrigerant: 'R-410A',
    readings_std: {
      indoor_temp: 78, // Not reaching setpoint
      outdoor_temp: 88,
      supply_air_temp: 65, // Warmer than ideal
      return_air_temp: 78,
      liquid_line_temp: 110, // High
      suction_line_temp: 60, // Warm
      suction_pressure: 140, // High
      discharge_pressure: 420, // Very high
      voltage: 240,
      amperage: 18.7,
      static_pressure: 0.8, // Elevated
      filter_condition: 'very_dirty',
    },
    user_notes: 'System running continuously but not cooling properly. Condenser coil looks dirty.',
  }

  try {
    const result = await analyzeSystem(request)

    console.log(`Status: ${result.status}`)
    console.log(`System Status: ${result.system_status}`)
    console.log(`\nSummary:\n${result.summary}`)

    console.log(`\nCritical Issues:`)
    result.faults
      .filter(f => f.severity === 'critical')
      .forEach(fault => {
        console.log(`\n⚠️  ${fault.component}: ${fault.issue}`)
        console.log(`    ${fault.explanation}`)
        console.log(`    → ${fault.recommended_action}`)
      })

    console.log(`\nWarnings:`)
    result.faults
      .filter(f => f.severity === 'warning')
      .forEach(fault => {
        console.log(`\n⚡ ${fault.component}: ${fault.issue}`)
        console.log(`    → ${fault.recommended_action}`)
      })

  } catch (error) {
    console.error('Error:', error)
  }
}

// ============================================================================
// Example 6: Error Handling - Invalid System Type
// ============================================================================

async function example6_ErrorHandling() {
  console.log('\n=== Example 6: Error Handling ===\n')

  // Missing API key
  try {
    const result = await analyzeSystem({
      apiKey: '',
      modelId: 'anthropic/claude-3-haiku',
      system_type: 'Heat Pump Split System',
      readings_std: {
        supply_air_temp: 55,
        return_air_temp: 72,
      },
    })

    if (result.status === 'error') {
      console.log(`Error: ${result.error_message}`)
    }
  } catch (error) {
    console.error('Caught error:', error)
  }
}

// ============================================================================
// Example 7: Testing Different AI Models
// ============================================================================

async function example7_ModelComparison() {
  console.log('\n=== Example 7: Model Comparison ===\n')

  const baseRequest = {
    apiKey: 'sk-or-v1-your-api-key-here',
    system_type: 'Heat Pump Split System' as const,
    refrigerant: 'R-410A' as const,
    readings_std: {
      indoor_temp: 72,
      outdoor_temp: 95,
      supply_air_temp: 55,
      return_air_temp: 75,
      suction_pressure: 118,
      discharge_pressure: 350,
    },
  }

  const models = [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4-turbo',
    'anthropic/claude-3-haiku',
  ]

  for (const modelId of models) {
    console.log(`\nTesting ${modelId}...`)
    const startTime = Date.now()

    try {
      const result = await analyzeSystem({
        ...baseRequest,
        modelId,
      })

      const duration = Date.now() - startTime
      console.log(`  ✓ Success (${duration}ms)`)
      console.log(`  Status: ${result.system_status}`)
      console.log(`  Faults: ${result.faults.length}`)

    } catch (error) {
      console.log(`  ✗ Failed: ${error}`)
    }
  }
}

// ============================================================================
// Example 8: Custom Readings
// ============================================================================

async function example8_CustomReadings() {
  console.log('\n=== Example 8: Custom Readings ===\n')

  const request: DiagnosticRequest = {
    apiKey: 'sk-or-v1-your-api-key-here',
    modelId: 'anthropic/claude-3.5-sonnet',
    system_type: 'Gas Split AC System',
    refrigerant: 'R-410A',
    readings_std: {
      // Standard readings
      supply_air_temp: 54,
      return_air_temp: 74,
      outdoor_temp: 98,

      // Custom readings (will be included in prompt)
      evaporator_coil_temp: 48,
      condenser_entering_air: 98,
      condenser_leaving_air: 115,
      humidity_indoor: 55,
      humidity_outdoor: 70,
      compressor_surface_temp: 180,
    },
  }

  try {
    const result = await analyzeSystem(request)

    console.log(`Status: ${result.status}`)
    console.log(`\nThe AI analyzed ${Object.keys(request.readings_std).length} readings`)
    console.log(`\nSummary:\n${result.summary}`)

  } catch (error) {
    console.error('Error:', error)
  }
}

// ============================================================================
// Run Examples
// ============================================================================

async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     HVAC AI Diagnostic Service - Usage Examples           ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  // Uncomment the examples you want to run:

  // await example1_FullHeatPumpDiagnostic()
  // await example2_GasFurnaceDiagnostic()
  // await example3_MinimalDataDiagnostic()
  // await example4_DualFuelHeating()
  // await example5_PackUnitWithIssues()
  // await example6_ErrorHandling()
  // await example7_ModelComparison()
  // await example8_CustomReadings()

  console.log('\n✓ Examples completed')
  console.log('\nNote: Replace "sk-or-v1-your-api-key-here" with your actual OpenRouter API key')
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error)
}

export {
  example1_FullHeatPumpDiagnostic,
  example2_GasFurnaceDiagnostic,
  example3_MinimalDataDiagnostic,
  example4_DualFuelHeating,
  example5_PackUnitWithIssues,
  example6_ErrorHandling,
  example7_ModelComparison,
  example8_CustomReadings,
}
