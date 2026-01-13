import { UnitType, TroubleshootingMode } from '../types'

export interface FieldTemplate {
  parameter: string
  unit: UnitType | 'text' | 'yes/no'
  section: string
  placeholder?: string
  isRequired?: boolean
  priorityModes?: TroubleshootingMode[] // Which modes make this field a priority
}

export interface SystemTemplate {
  systemType: string
  sections: {
    name: string
    fields: FieldTemplate[]
  }[]
}

export const SYSTEM_TEMPLATES: Record<string, SystemTemplate> = {
  'Gas Split AC System': {
    systemType: 'Gas Split AC System',
    sections: [
      {
        name: 'General Info',
        fields: [
          { parameter: 'Outdoor Model #', unit: 'text', section: 'General Info', placeholder: 'e.g., ABC-1234' },
          { parameter: 'Indoor Model #', unit: 'text', section: 'General Info', placeholder: 'e.g., XYZ-5678' },
          { parameter: 'Serial # (Outdoor)', unit: 'text', section: 'General Info' },
          { parameter: 'Serial # (Indoor)', unit: 'text', section: 'General Info' },
          { parameter: 'Refrigerant Type', unit: 'text', section: 'General Info', placeholder: 'e.g., R-410A' },
          { parameter: 'System Age', unit: 'text', section: 'General Info', placeholder: 'Years' },
          { parameter: 'System Capacity', unit: 'text', section: 'General Info', placeholder: 'Tons' },
          { parameter: 'Ambient Temp', unit: '°F', section: 'General Info', isRequired: true },
          { parameter: 'Relative Humidity', unit: 'text', section: 'General Info', placeholder: '%' },
        ],
      },
      {
        name: 'Cooling Readings',
        fields: [
          { parameter: 'Suction Pressure', unit: 'PSI', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Head Pressure', unit: 'PSI', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Suction Line Temp', unit: '°F', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Liquid Line Temp', unit: '°F', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Superheat', unit: '°F', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Subcooling', unit: '°F', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Compressor Amps', unit: 'A', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Condenser Fan Amps', unit: 'A', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Blower Amps', unit: 'A', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Voltage', unit: 'V', section: 'Cooling Readings', priorityModes: ['cooling', 'heating', 'both'] },
          { parameter: 'Supply Temp', unit: '°F', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Return Temp', unit: '°F', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Temperature Split (ΔT)', unit: '°F', section: 'Cooling Readings', priorityModes: ['cooling', 'both'] },
          { parameter: 'Static Pressure', unit: 'in. w.c.', section: 'Cooling Readings', priorityModes: ['cooling', 'heating', 'both'] },
        ],
      },
      {
        name: 'Heating Readings (Furnace)',
        fields: [
          { parameter: 'Manifold Gas Pressure', unit: 'in. w.c.', section: 'Heating Readings', priorityModes: ['heating', 'both'] },
          { parameter: 'Inlet Gas Pressure', unit: 'in. w.c.', section: 'Heating Readings', priorityModes: ['heating', 'both'] },
          { parameter: 'Temperature Rise', unit: '°F', section: 'Heating Readings', priorityModes: ['heating', 'both'] },
          { parameter: 'Flame Sensor', unit: 'text', section: 'Heating Readings', placeholder: 'µA', priorityModes: ['heating', 'both'] },
          { parameter: 'Inducer Motor Amps', unit: 'A', section: 'Heating Readings', priorityModes: ['heating', 'both'] },
          { parameter: 'CO', unit: 'text', section: 'Heating Readings', placeholder: 'ppm', priorityModes: ['heating', 'both'] },
          { parameter: 'Safety Controls Checked', unit: 'yes/no', section: 'Heating Readings', priorityModes: ['heating', 'both'] },
        ],
      },
      {
        name: 'Inspection Fields',
        fields: [
          { parameter: 'Filter Condition', unit: 'text', section: 'Inspection', placeholder: 'Clean/Dirty/Replace' },
          { parameter: 'Drain Line Condition', unit: 'text', section: 'Inspection' },
          { parameter: 'Coil Condition', unit: 'text', section: 'Inspection' },
          { parameter: 'Electrical Connections', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
          { parameter: 'Safety Switch Test', unit: 'yes/no', section: 'Inspection' },
          { parameter: 'Thermostat Operation', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
        ],
      },
    ],
  },

  'Heat Pump Split System': {
    systemType: 'Heat Pump Split System',
    sections: [
      {
        name: 'General Info',
        fields: [
          { parameter: 'Outdoor Model #', unit: 'text', section: 'General Info', placeholder: 'e.g., HP-1234' },
          { parameter: 'Indoor Model #', unit: 'text', section: 'General Info' },
          { parameter: 'Serial # (Outdoor)', unit: 'text', section: 'General Info' },
          { parameter: 'Serial # (Indoor)', unit: 'text', section: 'General Info' },
          { parameter: 'Refrigerant Type', unit: 'text', section: 'General Info', placeholder: 'e.g., R-410A' },
          { parameter: 'System Capacity', unit: 'text', section: 'General Info', placeholder: 'Tons' },
          { parameter: 'Reversing Valve Type', unit: 'text', section: 'General Info', placeholder: 'O or B' },
          { parameter: 'Ambient Temp', unit: '°F', section: 'General Info', isRequired: true },
        ],
      },
      {
        name: 'Cooling Mode Readings',
        fields: [
          { parameter: 'Suction Pressure', unit: 'PSI', section: 'Cooling Mode', isRequired: true },
          { parameter: 'Head Pressure', unit: 'PSI', section: 'Cooling Mode', isRequired: true },
          { parameter: 'Suction Line Temp', unit: '°F', section: 'Cooling Mode' },
          { parameter: 'Liquid Line Temp', unit: '°F', section: 'Cooling Mode' },
          { parameter: 'Superheat', unit: '°F', section: 'Cooling Mode' },
          { parameter: 'Subcooling', unit: '°F', section: 'Cooling Mode' },
          { parameter: 'Compressor Amps', unit: 'A', section: 'Cooling Mode' },
          { parameter: 'Outdoor Fan Amps', unit: 'A', section: 'Cooling Mode' },
          { parameter: 'Blower Amps', unit: 'A', section: 'Cooling Mode' },
          { parameter: 'Supply Temp', unit: '°F', section: 'Cooling Mode', isRequired: true },
          { parameter: 'Return Temp', unit: '°F', section: 'Cooling Mode', isRequired: true },
          { parameter: 'ΔT', unit: '°F', section: 'Cooling Mode' },
          { parameter: 'Static Pressure', unit: 'in. w.c.', section: 'Cooling Mode' },
        ],
      },
      {
        name: 'Heating Mode Readings',
        fields: [
          { parameter: 'Suction Pressure (Heat)', unit: 'PSI', section: 'Heating Mode' },
          { parameter: 'Discharge Pressure (Heat)', unit: 'PSI', section: 'Heating Mode' },
          { parameter: 'Defrost Operation Verified', unit: 'yes/no', section: 'Heating Mode' },
          { parameter: 'Reversing Valve Operation', unit: 'text', section: 'Heating Mode', placeholder: 'Pass/Fail' },
          { parameter: 'Outdoor Coil Frosting', unit: 'yes/no', section: 'Heating Mode' },
          { parameter: 'Electric Heat Strip Amps', unit: 'A', section: 'Heating Mode' },
          { parameter: 'Temperature Rise (Heat)', unit: '°F', section: 'Heating Mode' },
          { parameter: 'Auxiliary Heat Operation', unit: 'text', section: 'Heating Mode', placeholder: 'Pass/Fail' },
        ],
      },
      {
        name: 'Inspection Fields',
        fields: [
          { parameter: 'Filter Condition', unit: 'text', section: 'Inspection', placeholder: 'Clean/Dirty/Replace' },
          { parameter: 'Indoor Coil Condition', unit: 'text', section: 'Inspection' },
          { parameter: 'Outdoor Coil Condition', unit: 'text', section: 'Inspection' },
          { parameter: 'Electrical Connections', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
          { parameter: 'Drain Condition', unit: 'text', section: 'Inspection' },
          { parameter: 'Thermostat Operation', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
        ],
      },
    ],
  },

  'Gas Pack Unit': {
    systemType: 'Gas Pack Unit',
    sections: [
      {
        name: 'General Info',
        fields: [
          { parameter: 'Unit Model #', unit: 'text', section: 'General Info' },
          { parameter: 'Serial #', unit: 'text', section: 'General Info' },
          { parameter: 'Refrigerant Type', unit: 'text', section: 'General Info', placeholder: 'e.g., R-410A' },
          { parameter: 'Capacity', unit: 'text', section: 'General Info', placeholder: 'Tons' },
          { parameter: 'Gas Type', unit: 'text', section: 'General Info', placeholder: 'Natural/LP' },
          { parameter: 'Ambient Temp', unit: '°F', section: 'General Info', isRequired: true },
        ],
      },
      {
        name: 'Cooling Readings',
        fields: [
          { parameter: 'Suction Pressure', unit: 'PSI', section: 'Cooling Readings', isRequired: true },
          { parameter: 'Head Pressure', unit: 'PSI', section: 'Cooling Readings', isRequired: true },
          { parameter: 'Superheat', unit: '°F', section: 'Cooling Readings' },
          { parameter: 'Subcooling', unit: '°F', section: 'Cooling Readings' },
          { parameter: 'Compressor Amps', unit: 'A', section: 'Cooling Readings' },
          { parameter: 'Supply Temp', unit: '°F', section: 'Cooling Readings', isRequired: true },
          { parameter: 'Return Temp', unit: '°F', section: 'Cooling Readings', isRequired: true },
          { parameter: 'ΔT', unit: '°F', section: 'Cooling Readings' },
          { parameter: 'Fan Motor Amps', unit: 'A', section: 'Cooling Readings' },
        ],
      },
      {
        name: 'Heating Readings',
        fields: [
          { parameter: 'Manifold Pressure', unit: 'in. w.c.', section: 'Heating Readings' },
          { parameter: 'Inlet Pressure', unit: 'in. w.c.', section: 'Heating Readings' },
          { parameter: 'Temp Rise', unit: '°F', section: 'Heating Readings' },
          { parameter: 'Flame Sensor', unit: 'text', section: 'Heating Readings', placeholder: 'µA' },
          { parameter: 'Inducer Amps', unit: 'A', section: 'Heating Readings' },
          { parameter: 'CO', unit: 'text', section: 'Heating Readings', placeholder: 'ppm' },
          { parameter: 'Safety Check', unit: 'yes/no', section: 'Heating Readings' },
        ],
      },
      {
        name: 'Inspection Fields',
        fields: [
          { parameter: 'Filter Condition', unit: 'text', section: 'Inspection', placeholder: 'Clean/Dirty/Replace' },
          { parameter: 'Coil Condition', unit: 'text', section: 'Inspection' },
          { parameter: 'Blower Wheel Condition', unit: 'text', section: 'Inspection' },
          { parameter: 'Drainage', unit: 'text', section: 'Inspection' },
          { parameter: 'Gas Line Tightness', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
          { parameter: 'Thermostat Operation', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
        ],
      },
    ],
  },

  'Straight AC Pack Unit': {
    systemType: 'Straight AC Pack Unit',
    sections: [
      {
        name: 'General Info',
        fields: [
          { parameter: 'Model #', unit: 'text', section: 'General Info' },
          { parameter: 'Serial #', unit: 'text', section: 'General Info' },
          { parameter: 'Refrigerant Type', unit: 'text', section: 'General Info', placeholder: 'e.g., R-410A' },
          { parameter: 'Capacity', unit: 'text', section: 'General Info', placeholder: 'Tons' },
          { parameter: 'Ambient Temp', unit: '°F', section: 'General Info', isRequired: true },
        ],
      },
      {
        name: 'Cooling Readings',
        fields: [
          { parameter: 'Suction Pressure', unit: 'PSI', section: 'Cooling Readings', isRequired: true },
          { parameter: 'Head Pressure', unit: 'PSI', section: 'Cooling Readings', isRequired: true },
          { parameter: 'Suction Line Temp', unit: '°F', section: 'Cooling Readings' },
          { parameter: 'Liquid Line Temp', unit: '°F', section: 'Cooling Readings' },
          { parameter: 'Superheat', unit: '°F', section: 'Cooling Readings' },
          { parameter: 'Subcooling', unit: '°F', section: 'Cooling Readings' },
          { parameter: 'Compressor Amps', unit: 'A', section: 'Cooling Readings' },
          { parameter: 'Fan Amps', unit: 'A', section: 'Cooling Readings' },
          { parameter: 'Supply Temp', unit: '°F', section: 'Cooling Readings', isRequired: true },
          { parameter: 'Return Temp', unit: '°F', section: 'Cooling Readings', isRequired: true },
          { parameter: 'ΔT', unit: '°F', section: 'Cooling Readings' },
          { parameter: 'Static Pressure', unit: 'in. w.c.', section: 'Cooling Readings' },
        ],
      },
      {
        name: 'Inspection Fields',
        fields: [
          { parameter: 'Filter Condition', unit: 'text', section: 'Inspection', placeholder: 'Clean/Dirty/Replace' },
          { parameter: 'Coil Cleanliness', unit: 'text', section: 'Inspection' },
          { parameter: 'Electrical Connections', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
          { parameter: 'Condensate Line', unit: 'text', section: 'Inspection' },
          { parameter: 'Thermostat Operation', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
          { parameter: 'Capacitor Test', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
        ],
      },
    ],
  },

  'Dual Fuel Unit': {
    systemType: 'Dual Fuel Unit',
    sections: [
      {
        name: 'General Info',
        fields: [
          { parameter: 'Outdoor Model #', unit: 'text', section: 'General Info' },
          { parameter: 'Indoor Model #', unit: 'text', section: 'General Info' },
          { parameter: 'Serial # (Outdoor)', unit: 'text', section: 'General Info' },
          { parameter: 'Serial # (Indoor)', unit: 'text', section: 'General Info' },
          { parameter: 'Refrigerant Type', unit: 'text', section: 'General Info', placeholder: 'e.g., R-410A' },
          { parameter: 'Capacity', unit: 'text', section: 'General Info', placeholder: 'Tons' },
          { parameter: 'Changeover Control Type', unit: 'text', section: 'General Info', placeholder: 'Thermostat/Board' },
          { parameter: 'Ambient Temp', unit: '°F', section: 'General Info', isRequired: true },
        ],
      },
      {
        name: 'Cooling Mode',
        fields: [
          { parameter: 'Suction Pressure', unit: 'PSI', section: 'Cooling Mode', isRequired: true },
          { parameter: 'Head Pressure', unit: 'PSI', section: 'Cooling Mode', isRequired: true },
          { parameter: 'Superheat', unit: '°F', section: 'Cooling Mode' },
          { parameter: 'Subcooling', unit: '°F', section: 'Cooling Mode' },
          { parameter: 'Compressor Amps', unit: 'A', section: 'Cooling Mode' },
          { parameter: 'Fan Amps', unit: 'A', section: 'Cooling Mode' },
          { parameter: 'Supply Temp', unit: '°F', section: 'Cooling Mode', isRequired: true },
          { parameter: 'Return Temp', unit: '°F', section: 'Cooling Mode', isRequired: true },
          { parameter: 'ΔT', unit: '°F', section: 'Cooling Mode' },
          { parameter: 'Static Pressure', unit: 'in. w.c.', section: 'Cooling Mode' },
        ],
      },
      {
        name: 'Heat Pump Mode',
        fields: [
          { parameter: 'Suction Pressure (HP)', unit: 'PSI', section: 'Heat Pump Mode' },
          { parameter: 'Discharge Pressure (HP)', unit: 'PSI', section: 'Heat Pump Mode' },
          { parameter: 'Reversing Valve Operation', unit: 'text', section: 'Heat Pump Mode', placeholder: 'Pass/Fail' },
          { parameter: 'Defrost Cycle Operation', unit: 'yes/no', section: 'Heat Pump Mode' },
          { parameter: 'Electric Heat Strip Amps', unit: 'A', section: 'Heat Pump Mode' },
          { parameter: 'Aux Heat Function', unit: 'yes/no', section: 'Heat Pump Mode' },
        ],
      },
      {
        name: 'Gas Heat Mode',
        fields: [
          { parameter: 'Manifold Gas Pressure', unit: 'in. w.c.', section: 'Gas Heat Mode' },
          { parameter: 'Inlet Gas Pressure', unit: 'in. w.c.', section: 'Gas Heat Mode' },
          { parameter: 'Temperature Rise', unit: '°F', section: 'Gas Heat Mode' },
          { parameter: 'Flame Sensor Reading', unit: 'text', section: 'Gas Heat Mode', placeholder: 'µA' },
          { parameter: 'Blower Amps', unit: 'A', section: 'Gas Heat Mode' },
          { parameter: 'CO', unit: 'text', section: 'Gas Heat Mode', placeholder: 'ppm' },
          { parameter: 'Safety Checks', unit: 'yes/no', section: 'Gas Heat Mode' },
        ],
      },
      {
        name: 'Inspection Fields',
        fields: [
          { parameter: 'Filter Condition', unit: 'text', section: 'Inspection', placeholder: 'Clean/Dirty/Replace' },
          { parameter: 'Coil Condition', unit: 'text', section: 'Inspection' },
          { parameter: 'Gas Piping', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
          { parameter: 'Venting', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
          { parameter: 'Thermostat Operation', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
          { parameter: 'Control Board Wiring', unit: 'text', section: 'Inspection', placeholder: 'Pass/Fail' },
        ],
      },
    ],
  },
}

// Common fields that appear on all system types
export const COMMON_FIELDS: FieldTemplate[] = [
  { parameter: 'Technician Name', unit: 'text', section: 'Common', placeholder: 'Your name' },
  { parameter: 'Job Notes', unit: 'text', section: 'Common', placeholder: 'Observations and findings' },
  { parameter: 'Recommendations', unit: 'text', section: 'Common', placeholder: 'Follow-up actions' },
]

export function getTemplateForSystem(systemType: string): SystemTemplate | null {
  return SYSTEM_TEMPLATES[systemType] || null
}

export function getAllSystemTypes(): string[] {
  return Object.keys(SYSTEM_TEMPLATES)
}

// Helper function to determine if a field is priority for the given mode
export function isFieldPriority(field: FieldTemplate, mode: TroubleshootingMode | null): boolean {
  if (!mode || mode === 'both') return true
  if (!field.priorityModes || field.priorityModes.length === 0) return false
  return field.priorityModes.includes(mode)
}

// Helper to get section priority status
export function getSectionPriorityInfo(fields: FieldTemplate[], mode: TroubleshootingMode | null): {
  totalPriority: number
  filledPriority: number
  isPrioritySection: boolean
} {
  const priorityFields = fields.filter(f => isFieldPriority(f, mode))
  const filledPriorityFields = priorityFields.filter(f => f.parameter)

  return {
    totalPriority: priorityFields.length,
    filledPriority: filledPriorityFields.length,
    isPrioritySection: priorityFields.length > 0
  }
}
