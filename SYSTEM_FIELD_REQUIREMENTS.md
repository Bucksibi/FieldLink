# FieldLink - System Field Requirements

Complete breakdown of required and optional fields for each HVAC system type.

---

## System Types (5)

| System Type | Description |
|-------------|-------------|
| Gas Split AC System | Split system with gas furnace for heating + electric AC for cooling |
| Heat Pump Split System | Reversible heat pump providing both heating and cooling |
| Gas Pack Unit | Packaged unit with gas heating and electric cooling in one cabinet |
| Straight AC Pack Unit | Packaged air conditioning unit (electric cooling only) |
| Dual Fuel Unit | Hybrid system combining heat pump + gas furnace for optimal efficiency |

---

## Troubleshooting Modes (3)

| Mode | Focus Area |
|------|------------|
| Cooling | Refrigerant circuit, airflow, and electrical performance |
| Heating | Furnace or heat pump heating operation |
| Both | Complete full system diagnostics including all components |

---

## Universal Required Fields (All Systems)

| Field | Unit | Required |
|-------|------|----------|
| Ambient Temp | °F | **YES** |

## Cooling Mode Required Fields (All AC Systems)

| Field | Unit | Required |
|-------|------|----------|
| Suction Pressure | PSI | **YES** |
| Head Pressure | PSI | **YES** |
| Supply Temp | °F | **YES** |
| Return Temp | °F | **YES** |

---

## 1. Gas Split AC System

### General Info
| Field | Unit | Required |
|-------|------|----------|
| Outdoor Model # | text | No |
| Indoor Model # | text | No |
| Serial # (Outdoor) | text | No |
| Serial # (Indoor) | text | No |
| Refrigerant Type | text | No |
| System Age | text | No |
| System Capacity | text | No |
| Ambient Temp | °F | **YES** |
| Relative Humidity | text | No |

### Cooling Readings
| Field | Unit | Priority Mode |
|-------|------|---------------|
| Suction Pressure | PSI | cooling, both |
| Head Pressure | PSI | cooling, both |
| Suction Line Temp | °F | cooling, both |
| Liquid Line Temp | °F | cooling, both |
| Superheat | °F | cooling, both |
| Subcooling | °F | cooling, both |
| Compressor Amps | A | cooling, both |
| Condenser Fan Amps | A | cooling, both |
| Blower Amps | A | cooling, both |
| Voltage | V | all modes |
| Supply Temp | °F | cooling, both |
| Return Temp | °F | cooling, both |
| Temperature Split ΔT | °F | cooling, both |
| Static Pressure | in. w.c. | all modes |

### Heating Readings (Furnace)
| Field | Unit | Priority Mode |
|-------|------|---------------|
| Manifold Gas Pressure | in. w.c. | heating, both |
| Inlet Gas Pressure | in. w.c. | heating, both |
| Temperature Rise | °F | heating, both |
| Flame Sensor | µA | heating, both |
| Inducer Motor Amps | A | heating, both |
| CO | ppm | heating, both |
| Safety Controls Checked | yes/no | heating, both |

---

## 2. Heat Pump Split System

### General Info
| Field | Unit | Required |
|-------|------|----------|
| Outdoor Model # | text | No |
| Indoor Model # | text | No |
| Serial # (Outdoor) | text | No |
| Serial # (Indoor) | text | No |
| Refrigerant Type | text | No |
| System Capacity | text | No |
| Reversing Valve Type | text (O/B) | No |
| Ambient Temp | °F | **YES** |

### Cooling Mode Readings
| Field | Unit | Required |
|-------|------|----------|
| Suction Pressure | PSI | **YES** |
| Head Pressure | PSI | **YES** |
| Suction Line Temp | °F | No |
| Liquid Line Temp | °F | No |
| Superheat | °F | No |
| Subcooling | °F | No |
| Compressor Amps | A | No |
| Outdoor Fan Amps | A | No |
| Blower Amps | A | No |
| Supply Temp | °F | **YES** |
| Return Temp | °F | **YES** |
| ΔT | °F | No |
| Static Pressure | in. w.c. | No |

### Heating Mode Readings
| Field | Unit | Required |
|-------|------|----------|
| Suction Pressure (Heat) | PSI | No |
| Discharge Pressure (Heat) | PSI | No |
| Defrost Operation Verified | yes/no | No |
| Reversing Valve Operation | text | No |
| Outdoor Coil Frosting | yes/no | No |
| Electric Heat Strip Amps | A | No |
| Temperature Rise (Heat) | °F | No |
| Auxiliary Heat Operation | text | No |

---

## 3. Gas Pack Unit

### General Info
| Field | Unit | Required |
|-------|------|----------|
| Unit Model # | text | No |
| Serial # | text | No |
| Refrigerant Type | text | No |
| Capacity | text | No |
| Gas Type | text (Natural/LP) | No |
| Ambient Temp | °F | **YES** |

### Cooling Readings
| Field | Unit | Required |
|-------|------|----------|
| Suction Pressure | PSI | **YES** |
| Head Pressure | PSI | **YES** |
| Superheat | °F | No |
| Subcooling | °F | No |
| Compressor Amps | A | No |
| Supply Temp | °F | **YES** |
| Return Temp | °F | **YES** |
| ΔT | °F | No |
| Fan Motor Amps | A | No |

### Heating Readings
| Field | Unit | Required |
|-------|------|----------|
| Manifold Pressure | in. w.c. | No |
| Inlet Pressure | in. w.c. | No |
| Temp Rise | °F | No |
| Flame Sensor | µA | No |
| Inducer Amps | A | No |
| CO | ppm | No |
| Safety Check | yes/no | No |

---

## 4. Straight AC Pack Unit

### General Info
| Field | Unit | Required |
|-------|------|----------|
| Model # | text | No |
| Serial # | text | No |
| Refrigerant Type | text | No |
| Capacity | text | No |
| Ambient Temp | °F | **YES** |

### Cooling Readings
| Field | Unit | Required |
|-------|------|----------|
| Suction Pressure | PSI | **YES** |
| Head Pressure | PSI | **YES** |
| Suction Line Temp | °F | No |
| Liquid Line Temp | °F | No |
| Superheat | °F | No |
| Subcooling | °F | No |
| Compressor Amps | A | No |
| Fan Amps | A | No |
| Supply Temp | °F | **YES** |
| Return Temp | °F | **YES** |
| ΔT | °F | No |
| Static Pressure | in. w.c. | No |

---

## 5. Dual Fuel Unit (Most Complex)

### General Info
| Field | Unit | Required |
|-------|------|----------|
| Outdoor Model # | text | No |
| Indoor Model # | text | No |
| Serial # (Outdoor) | text | No |
| Serial # (Indoor) | text | No |
| Refrigerant Type | text | No |
| Capacity | text | No |
| Changeover Control Type | text (Thermostat/Board) | No |
| Ambient Temp | °F | **YES** |

### Cooling Mode
| Field | Unit | Required |
|-------|------|----------|
| Suction Pressure | PSI | **YES** |
| Head Pressure | PSI | **YES** |
| Superheat | °F | No |
| Subcooling | °F | No |
| Compressor Amps | A | No |
| Fan Amps | A | No |
| Supply Temp | °F | **YES** |
| Return Temp | °F | **YES** |
| ΔT | °F | No |
| Static Pressure | in. w.c. | No |

### Heat Pump Mode
| Field | Unit | Required |
|-------|------|----------|
| Suction Pressure (HP) | PSI | No |
| Discharge Pressure (HP) | PSI | No |
| Reversing Valve Operation | text | No |
| Defrost Cycle Operation | yes/no | No |
| Electric Heat Strip Amps | A | No |
| Aux Heat Function | yes/no | No |

### Gas Heat Mode
| Field | Unit | Required |
|-------|------|----------|
| Manifold Gas Pressure | in. w.c. | No |
| Inlet Gas Pressure | in. w.c. | No |
| Temperature Rise | °F | No |
| Flame Sensor Reading | µA | No |
| Blower Amps | A | No |
| CO | ppm | No |
| Safety Checks | yes/no | No |

---

## Inspection Fields (All Systems)

| Field | Type |
|-------|------|
| Filter Condition | text |
| Coil Condition | text |
| Electrical Connections | text |
| Drain/Condensate Line | text |
| Thermostat Operation | text |
| Safety Switch Test | yes/no |

---

## Validation Ranges

| Parameter | Warning Range | Unit |
|-----------|---------------|------|
| Supply Air Temp | 40 - 140 | °F |
| Return Air Temp | 50 - 90 | °F |
| Outdoor Air Temp | -20 - 120 | °F |
| Suction Pressure | 30 - 120 | PSI |
| Discharge Pressure | 100 - 500 | PSI |
| Superheat | 5 - 25 | °F |
| Subcooling | 5 - 20 | °F |
| Delta T (ΔT) | 14 - 24 | °F |
| Static Pressure | 0.2 - 1.5 | in. w.c. |
| Voltage | 100 - 480 | V |
| Amperage | 1 - 100 | A |

---

## Key Notes

1. **Ambient Temperature** is required for ALL system types
2. **Pressure readings** (Suction + Head) are required for cooling diagnostics
3. **Supply/Return Temp** are required for temperature differential analysis
4. **Dual Fuel** has the most fields (heat pump + gas furnace combined)
5. **Gas systems** need combustion analysis (Flame Sensor, CO, gas pressures)
6. **Heat pumps** need reversing valve and defrost verification
7. Fields are dynamically shown/hidden based on selected troubleshooting mode

---

## Data Flow

1. **Frontend** (`systemFieldTemplates.ts`) - Defines field structure and priority modes
2. **Component** (`DataInputFormEnhanced.tsx`) - Renders fields based on system type
3. **Types** (`types/index.ts`) - Defines StandardReadings interface
4. **Validation** (`validation.ts`) - Ensures readings are within acceptable ranges
5. **Backend** (`aiService.ts`) - Uses readings for AI diagnostic prompts
6. **AI Analysis** - Gemini analyzes readings against system-type context
