# Frontend Interface Guide

## Overview

The HVAC Diagnostic App frontend provides a comprehensive interface for collecting system data and running AI-powered diagnostics. It features two modes:

1. **AI Mode** - Full-featured diagnostic interface with OpenRouter AI integration
2. **Simple Mode** - Quick symptom-based diagnostics (legacy)

## Components Built

### 1. SystemSelector.tsx
**Purpose**: Dropdown for selecting HVAC system type

**Features**:
- 5 supported system types:
  - Gas Split AC System
  - Heat Pump Split System
  - Gas Pack Unit
  - Straight AC Pack Unit
  - Dual Fuel Unit
- Required field validation
- Clear labels and help text

**Usage**:
```tsx
<SystemSelector
  value={systemType}
  onChange={setSystemType}
/>
```

---

### 2. RefrigerantInput.tsx
**Purpose**: Optional refrigerant type selection

**Features**:
- Dropdown with common refrigerants (R-410A, R-22, R-32, R-134a, R-407C, R-404A)
- Custom text input for non-standard refrigerants
- Optional field (can be left blank)
- AI automatically adjusts analysis when blank

**Usage**:
```tsx
<RefrigerantInput
  value={refrigerant}
  onChange={setRefrigerant}
/>
```

---

### 3. DataInputForm.tsx
**Purpose**: Dynamic table for entering system readings

**Features**:
- **Dynamic rows**: Add/remove readings as needed
- **Three fields per reading**:
  - Parameter name (e.g., "Supply Air Temp")
  - Value (numeric)
  - Unit (dropdown: °F, °C, PSI, kPa, CFM, L/s, V, A, W, in. w.c.)
- **Automatic unit conversion**: All values standardized internally
  - Temperatures → °F
  - Pressures → PSI
  - Airflow → CFM
  - Electrical → no conversion
- **Smart unit suggestions**: Detects parameter name and suggests relevant units
- **Real-time validation**: Shows errors for invalid numbers or incomplete fields
- **Parameter normalization**: Maps variations to standard names
  - "Supply Temp" → "supply_air_temp"
  - "High Pressure" → "discharge_pressure"
  - "Amps" → "amperage"

**Usage**:
```tsx
<DataInputForm
  onChange={(readings) => setReadings(readings)}
/>
```

**Example Input**:
| Parameter | Value | Unit |
|-----------|-------|------|
| Supply Air Temp | 55 | °F |
| Return Air Temp | 75 | °F |
| Suction Pressure | 118 | PSI |
| Discharge Pressure | 350 | PSI |

**Standardized Output**:
```json
{
  "supply_air_temp": 55,
  "return_air_temp": 75,
  "suction_pressure": 118,
  "discharge_pressure": 350
}
```

---

### 4. ModelManager.tsx
**Purpose**: OpenRouter API key management and model selection

**Features**:
- **API Key Input**:
  - Secure password field with show/hide toggle
  - Stored in localStorage (key: `hvac_ai_key`)
  - Disconnect option to clear key
- **Model Fetching**:
  - Fetches available models from OpenRouter API
  - Validates API key automatically
  - Displays connection status
- **Model Selection**:
  - Grouped dropdown (Recommended / Other Models)
  - No pre-selection - user must choose
  - Prioritizes HVAC-suitable models:
    - Claude 3.5 Sonnet
    - Claude 3 Opus
    - Claude 3 Haiku
    - GPT-4 Turbo
    - GPT-4
    - GPT-3.5 Turbo
- **Error Handling**:
  - Invalid API key detection
  - Network error messages
  - Clear user feedback

**Usage**:
```tsx
<ModelManager
  onModelSelect={(modelId, apiKey) => {
    setSelectedModel(modelId)
    setApiKey(apiKey)
  }}
  onApiKeyValidated={(isValid) => {
    console.log('API key valid:', isValid)
  }}
/>
```

**API Key Storage**:
- Stored: `localStorage.setItem('hvac_ai_key', apiKey)`
- Retrieved: `localStorage.getItem('hvac_ai_key')`
- Cleared: `localStorage.removeItem('hvac_ai_key')`

---

### 5. DiagnosticResults.tsx
**Purpose**: Display AI diagnostic results

**Features**:
- **Status Badge**: Visual indicator (Normal/Attention Needed/Critical)
- **Summary Section**: AI-generated overview
- **Performance Metrics Cards**:
  - ΔT (Delta T)
  - Superheat
  - Subcooling
  - Efficiency Rating
  - Custom metrics
- **Faults Section**:
  - Severity badges (Critical/Warning/Info)
  - Component identification
  - Detailed explanations
  - Recommended actions
  - Confidence levels
- **Recommendations List**: Numbered action items
- **Success State**: Special display for normal operation

**Color Coding**:
- **Critical**: Red
- **Warning**: Yellow
- **Info**: Blue
- **Normal**: Green

---

### 6. DiagnosticsInputPage.tsx
**Purpose**: Main page combining all components

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│                    HVAC AI Diagnostic Tool              │
│              Professional HVAC diagnostics powered by AI │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────┬─────────────────────────────┐
│  System Configuration   │   AI Configuration          │
│  ├─ System Type        │   ├─ API Key Input          │
│  └─ Refrigerant        │   └─ Model Selection        │
│                         │                             │
│  System Readings        │   Actions                   │
│  └─ Data Input Table   │   ├─ Validation Status      │
│                         │   ├─ Run Diagnostics        │
│  Technician Notes       │   └─ Reset Button           │
│  └─ Text Area          │                             │
└─────────────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Diagnostic Results                    │
│  ├─ Summary & Status                                    │
│  ├─ Performance Metrics                                 │
│  ├─ Faults Detected                                     │
│  └─ Recommendations                                     │
└─────────────────────────────────────────────────────────┘
```

**Workflow**:
1. Select system type (required)
2. Enter refrigerant (optional)
3. Add system readings (minimum 1 required)
4. Connect OpenRouter API key
5. Select AI model
6. Add technician notes (optional)
7. Click "Run Diagnostics"
8. View results
9. Reset for new diagnostic

**Validation**:
- Real-time status indicators (green dots)
- Pre-submission validation
- Clear error messages
- Disabled submit until requirements met

---

## Unit Conversion System

### Temperature Conversions
```typescript
°C to °F: (°C × 9/5) + 32
°F to °F: no conversion
```

### Pressure Conversions
```typescript
kPa to PSI: kPa × 0.145038
PSI to PSI: no conversion
```

### Airflow Conversions
```typescript
L/s to CFM: L/s × 2.11888
CFM to CFM: no conversion
```

### Electrical
No conversion needed (V, A, W)

---

## API Integration

### Endpoint Used
```
POST /api/diagnostics/ai
```

### Request Format
```json
{
  "apiKey": "sk-or-v1-xxxxx",
  "modelId": "anthropic/claude-3.5-sonnet",
  "system_type": "Heat Pump Split System",
  "refrigerant": "R-410A",
  "readings_std": {
    "supply_air_temp": 55,
    "return_air_temp": 75,
    "suction_pressure": 118,
    "discharge_pressure": 350,
    "outdoor_temp": 95
  },
  "user_notes": "Customer reports weak cooling on hot days"
}
```

### Response Format
```json
{
  "status": "success",
  "system_status": "attention_needed",
  "faults": [
    {
      "severity": "warning",
      "component": "Refrigerant Circuit",
      "issue": "Low subcooling detected",
      "explanation": "...",
      "recommended_action": "...",
      "confidence": 85
    }
  ],
  "metrics": {
    "delta_t": 20,
    "superheat": 12,
    "subcooling": 8,
    "efficiency_rating": "good"
  },
  "summary": "...",
  "recommendations": ["...", "..."],
  "timestamp": "2024-01-01T12:00:00.000Z",
  "model_used": "anthropic/claude-3.5-sonnet"
}
```

---

## User Experience Features

### 1. Dark Mode Support
All components support light/dark themes automatically based on system preference.

### 2. Responsive Design
- Mobile-friendly (single column on small screens)
- Desktop-optimized (multi-column layout)
- Tablet support (adaptive grid)

### 3. Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Clear focus indicators
- Screen reader friendly

### 4. Loading States
- Spinner animations
- Disabled buttons during processing
- Progress indicators
- Loading text

### 5. Error Handling
- Inline validation errors
- Network error messages
- API error display
- User-friendly error text

### 6. Data Persistence
- API key stored in localStorage
- Survives page refresh
- Secure client-side storage
- Easy disconnect option

---

## Development Notes

### File Structure
```
frontend/src/
├── components/
│   ├── SystemSelector.tsx
│   ├── RefrigerantInput.tsx
│   ├── DataInputForm.tsx
│   ├── ModelManager.tsx
│   ├── DiagnosticsInputPage.tsx
│   └── DiagnosticResults.tsx
├── utils/
│   └── unitConversion.ts
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

### Dependencies
- React 18
- TypeScript
- TailwindCSS
- Vite

### Type Safety
All components are fully typed with TypeScript interfaces ensuring:
- Compile-time error checking
- IntelliSense support
- Refactoring safety
- Documentation via types

### Performance
- Lazy loading considered for large component trees
- Memoization for expensive calculations
- Optimized re-renders
- Efficient state management

---

## Testing Recommendations

### Unit Tests
- Unit conversion functions
- Parameter normalization
- Validation logic

### Integration Tests
- Form submission flow
- API integration
- Error handling

### E2E Tests
- Complete diagnostic workflow
- Model selection flow
- Results display

---

## Future Enhancements

1. **Reading Templates**: Pre-fill common reading sets
2. **Export Results**: PDF/JSON export
3. **History**: Save previous diagnostics
4. **Comparison**: Compare multiple diagnostics
5. **Charts**: Visualize metrics over time
6. **Photos**: Upload equipment photos
7. **Voice Input**: Dictate readings
8. **Offline Mode**: Cache for offline use
9. **Multi-language**: i18n support
10. **Mobile App**: Native mobile version

---

## Troubleshooting

### API Key Not Working
- Verify key starts with `sk-or-v1-`
- Check OpenRouter account has credits
- Test key at openrouter.ai

### Models Not Loading
- Check network connection
- Verify API key is valid
- Check browser console for errors

### Results Not Displaying
- Check backend is running (port 4000)
- Verify API endpoint is accessible
- Check browser network tab for errors

### Unit Conversion Issues
- Verify numeric values only
- Check unit is selected
- Ensure parameter name is clear

---

## Security Considerations

### API Key Storage
- Stored in localStorage (client-side only)
- Never sent to backend (proxy mode)
- User controls key lifecycle
- Clear instruction to disconnect when done

### Data Privacy
- No data stored server-side
- No analytics tracking
- No third-party cookies
- Local-first architecture

### HTTPS Required
- OpenRouter requires HTTPS in production
- Use HTTPS for production deployment
- Consider SSL/TLS certificates

---

## Deployment Notes

### Environment Variables
No environment variables needed - all configuration is user-provided at runtime.

### Build Command
```bash
cd frontend
npm run build
```

### Output
Static files in `frontend/dist/` ready for any static hosting:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Any web server

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend is running
3. Test API key at OpenRouter
4. Check network connectivity
5. Review this guide for common issues
