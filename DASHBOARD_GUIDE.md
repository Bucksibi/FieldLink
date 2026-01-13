# Dashboard Components Guide

## Overview

The diagnostic results dashboard provides a professional, animated, and visually appealing display of AI-generated HVAC diagnostics. Built with Framer Motion for smooth animations and TailwindCSS for styling.

---

## Components

### 1. DiagnosticResultCard.tsx

**Purpose**: Display individual performance metrics with visual severity indicators.

**Features**:
- **4 Severity Levels**:
  - 🟢 **Normal** - Green (everything operating correctly)
  - 🟡 **Warning** - Yellow (attention recommended)
  - 🔴 **Fault** - Red (critical issue)
  - 🔵 **Info** - Blue (informational)

- **Animated Entry**: Staggered fade-in with slide-up animation
- **Hover Effects**: Subtle scale animation on hover
- **Visual Elements**:
  - Color-coded borders and backgrounds
  - Severity icons (checkmark, warning, error, info)
  - Vertical severity stripe
  - Animated background gradient
  - Large value display with unit
  - Optional description text

**Props**:
```typescript
interface DiagnosticResultCardProps {
  name: string              // Metric name (e.g., "ΔT")
  value: number | string    // Metric value
  unit?: string            // Unit (e.g., "°F")
  severity?: MetricSeverity // 'normal' | 'warning' | 'fault' | 'info'
  description?: string     // Optional description
  index?: number          // For staggered animation
}
```

**Example Usage**:
```tsx
<DiagnosticResultCard
  name="ΔT"
  value={20.5}
  unit="°F"
  severity="normal"
  description="Temperature difference between supply and return air"
  index={0}
/>
```

**Visual Design**:
```
┌─────────────────────────────┐
│█ ΔT                      ✓ │  ← Severity stripe & icon
│  20.5 °F                    │  ← Large value display
│  Temperature difference...  │  ← Description
└─────────────────────────────┘
```

---

### 2. DiagnosticSummary.tsx

**Purpose**: Display AI-generated summary text with copy functionality and optional raw JSON view.

**Features**:
- **Gradient Header**: Eye-catching blue-to-indigo gradient
- **Copy Summary Button**: One-click copy to clipboard
- **Metadata Display**:
  - AI model used
  - Timestamp
- **Raw JSON Toggle**: Collapsible section for advanced users
- **Syntax Highlighting**: Green-on-dark terminal-style JSON display
- **Copy JSON Button**: Separate button for copying raw data
- **Animated Transitions**: Smooth expand/collapse animation

**Props**:
```typescript
interface DiagnosticSummaryProps {
  summary: string       // AI-generated summary text
  rawData?: object     // Full diagnostic result object
  timestamp?: string   // ISO timestamp
  modelUsed?: string   // Model ID
}
```

**Example Usage**:
```tsx
<DiagnosticSummary
  summary="System is operating with adequate cooling but shows signs of slight refrigerant undercharge..."
  rawData={fullResult}
  timestamp="2024-01-01T12:00:00.000Z"
  modelUsed="anthropic/claude-3.5-sonnet"
/>
```

**Visual Layout**:
```
┌──────────────────────────────────────────────┐
│ 📄 Diagnostic Summary        [Copy Summary] │ ← Gradient header
│ 🖥️  anthropic/claude-3.5-sonnet  🕐 12:00  │ ← Metadata
├──────────────────────────────────────────────┤
│ System is operating with adequate cooling... │ ← Summary text
├──────────────────────────────────────────────┤
│ Advanced: View Raw JSON                   ▼ │ ← Collapsible toggle
└──────────────────────────────────────────────┘
```

---

### 3. ResultsDashboard.tsx

**Purpose**: Main orchestrator component that combines all dashboard elements.

**Features**:
- **Status Header**: Large colored banner showing overall system status
  - 🟢 Green: Normal operation
  - 🟡 Yellow: Attention needed
  - 🔴 Red: Critical issues
  - Large checkmark (✓), warning (⚠), or error (✕) icon

- **Metrics Grid**: Responsive grid of DiagnosticResultCard components
  - Priority metrics first (ΔT, superheat, subcooling, efficiency)
  - Auto-layout: 1 column mobile, 2 tablet, 4 desktop
  - Staggered animation entrance

- **Summary Section**: DiagnosticSummary component with full details

- **Faults Display**: Detailed fault cards with:
  - Severity badges
  - Component identification
  - Issue explanation
  - Recommended actions
  - Confidence levels
  - Color-coded left border

- **Recommendations**: Numbered action items with hover effects

- **No Issues State**: Special celebratory animation for normal systems

**Props**:
```typescript
interface ResultsDashboardProps {
  result: DiagnosticResult  // Complete diagnostic result
}
```

**Example Usage**:
```tsx
<ResultsDashboard result={diagnosticResult} />
```

**Full Layout**:
```
┌─────────────────────────────────────────────────────┐
│ 🔴 Diagnostic Results                            ✕ │ ← Status banner
│    System Status: CRITICAL                          │
└─────────────────────────────────────────────────────┘

Performance Metrics
┌─────────┬─────────┬─────────┬─────────┐
│ ΔT Card │ Super.  │ Subcool │ Effic.  │ ← Metric cards
│ 20°F    │ 12°F    │ 8°F     │ Good    │
└─────────┴─────────┴─────────┴─────────┘

┌─────────────────────────────────────────────────────┐
│ 📄 Diagnostic Summary        [Copy Summary]        │
│ AI-generated summary text...                        │ ← Summary
└─────────────────────────────────────────────────────┘

Issues Detected (2)
┌─────────────────────────────────────────────────────┐
│ [WARNING] Refrigerant Circuit                       │
│ Low subcooling detected                             │
│ Explanation: Subcooling of 8°F indicates...        │ ← Fault cards
│ ⚡ Recommended Action: Check for leaks...           │
└─────────────────────────────────────────────────────┘

Recommended Actions
1. Perform leak test on refrigerant circuit
2. Verify refrigerant charge using superheat method    ← Recommendations
3. Monitor system performance after adjustments
```

---

## Animation System

### Entry Animations

**Dashboard Header**:
```typescript
initial={{ opacity: 0, y: -20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
```

**Metric Cards**:
```typescript
// Staggered children with 0.1s delay between each
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, delay: index * 0.1 }}
```

**Summary Section**:
```typescript
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, delay: 0.2 }}
```

**Fault Cards**:
```typescript
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}
transition={{ duration: 0.4, delay: index * 0.1 }}
```

### Hover Effects

**Metric Cards**:
- Scale: 1.0 → 1.02 (smooth scale-up)
- Shadow: md → lg (elevation increase)

**Summary Text**:
- Fade in with 0.5s delay

### Continuous Animations

**Metric Card Background**:
- Radial gradient moving in circular pattern
- 5-second loop, infinite repeat
- Subtle opacity (5%)

**Normal Status Checkmark**:
- Pulse effect: scale 1 → 1.1 → 1
- 2-second loop, infinite repeat

---

## Color System

### Severity Colors

**Normal (Green)**:
```css
Background: bg-green-50 dark:bg-green-900/20
Border: border-green-200 dark:border-green-800
Text: text-green-800 dark:text-green-200
Icon: text-green-600 dark:text-green-400
```

**Warning (Yellow)**:
```css
Background: bg-yellow-50 dark:bg-yellow-900/20
Border: border-yellow-200 dark:border-yellow-800
Text: text-yellow-800 dark:text-yellow-200
Icon: text-yellow-600 dark:text-yellow-400
```

**Fault (Red)**:
```css
Background: bg-red-50 dark:bg-red-900/20
Border: border-red-200 dark:border-red-800
Text: text-red-800 dark:text-red-200
Icon: text-red-600 dark:text-red-400
```

**Info (Blue)**:
```css
Background: bg-blue-50 dark:bg-blue-900/20
Border: border-blue-200 dark:border-blue-800
Text: text-blue-800 dark:text-blue-200
Icon: text-blue-600 dark:text-blue-400
```

### Status Banners

**Critical**:
```css
Gradient: from-red-500 to-red-700
```

**Attention Needed**:
```css
Gradient: from-yellow-500 to-yellow-700
```

**Normal**:
```css
Gradient: from-green-500 to-green-700
```

---

## Responsive Design

### Breakpoints

**Mobile (< 768px)**:
- Metric grid: 1 column
- Full-width cards
- Stacked layout

**Tablet (768px - 1024px)**:
- Metric grid: 2 columns
- Comfortable card spacing

**Desktop (> 1024px)**:
- Metric grid: 4 columns
- Optimal information density

### Layout Strategy

```css
/* Mobile first */
grid-cols-1

/* Tablet */
md:grid-cols-2

/* Desktop */
lg:grid-cols-4
```

---

## Accessibility

### Features

1. **Semantic HTML**:
   - Proper heading hierarchy (h1 → h2 → h3)
   - Descriptive section labels
   - Meaningful button text

2. **Color Contrast**:
   - WCAG AA compliant
   - Dark mode support
   - Icon + text combinations

3. **Keyboard Navigation**:
   - Focusable interactive elements
   - Tab order follows visual flow
   - Clear focus indicators

4. **Screen Readers**:
   - Alt text for icons
   - ARIA labels where needed
   - Logical reading order

---

## Performance

### Optimization Strategies

1. **Framer Motion**:
   - Hardware-accelerated transforms
   - Efficient animation scheduling
   - Reduced motion support (respects `prefers-reduced-motion`)

2. **Conditional Rendering**:
   - Only render visible sections
   - Lazy load JSON display
   - Collapse unused panels

3. **Component Memoization** (recommended):
```typescript
const MemoizedCard = React.memo(DiagnosticResultCard)
```

4. **Image Optimization**:
   - SVG icons (no raster images)
   - Inline SVGs for instant rendering
   - No external image dependencies

---

## Usage Examples

### Example 1: Normal System

```tsx
const result: DiagnosticResult = {
  status: 'success',
  system_status: 'normal',
  faults: [],
  metrics: {
    delta_t: 20,
    superheat: 12,
    subcooling: 10,
    efficiency_rating: 'excellent'
  },
  summary: 'System operating perfectly within all parameters.',
  recommendations: ['Continue regular maintenance'],
  timestamp: '2024-01-01T12:00:00.000Z',
  model_used: 'anthropic/claude-3.5-sonnet'
}

<ResultsDashboard result={result} />
```

**Display**: Green banner, all metrics normal, celebration animation

### Example 2: Critical System

```tsx
const result: DiagnosticResult = {
  status: 'success',
  system_status: 'critical',
  faults: [
    {
      severity: 'critical',
      component: 'Compressor',
      issue: 'Dangerously high discharge pressure',
      explanation: 'Discharge pressure of 450 PSIG exceeds safe limits...',
      recommended_action: 'SHUT DOWN SYSTEM IMMEDIATELY. Check for blockages...',
      confidence: 95
    }
  ],
  metrics: {
    delta_t: 10,
    discharge_pressure: 450,
    efficiency_rating: 'poor'
  },
  summary: 'CRITICAL: System operating dangerously. Immediate shutdown required.',
  recommendations: [
    'Shut down system immediately',
    'Inspect discharge line for blockages',
    'Call certified HVAC technician'
  ],
  timestamp: '2024-01-01T12:00:00.000Z',
  model_used: 'anthropic/claude-3.5-sonnet'
}

<ResultsDashboard result={result} />
```

**Display**: Red banner, fault metrics, urgent recommendations

### Example 3: Attention Needed

```tsx
const result: DiagnosticResult = {
  status: 'success',
  system_status: 'attention_needed',
  faults: [
    {
      severity: 'warning',
      component: 'Refrigerant Circuit',
      issue: 'Low subcooling detected',
      explanation: 'Subcooling of 8°F is below optimal range...',
      recommended_action: 'Check for refrigerant leaks and verify charge',
      confidence: 85
    }
  ],
  metrics: {
    delta_t: 20,
    superheat: 12,
    subcooling: 8,
    efficiency_rating: 'good'
  },
  summary: 'System functioning but optimization recommended.',
  recommendations: [
    'Perform leak test',
    'Verify refrigerant charge',
    'Monitor performance'
  ],
  timestamp: '2024-01-01T12:00:00.000Z',
  model_used: 'anthropic/claude-3.5-sonnet'
}

<ResultsDashboard result={result} />
```

**Display**: Yellow banner, warning metrics, optimization suggestions

---

## Customization

### Adding Custom Metrics

To add a new metric type:

1. **Define metric in types**:
```typescript
// types/index.ts
export interface PerformanceMetrics {
  // ... existing metrics
  custom_metric?: number
}
```

2. **Add to dashboard priority list** (optional):
```typescript
// ResultsDashboard.tsx
const priorityMetrics = ['delta_t', 'superheat', 'subcooling', 'custom_metric']
```

3. **Add description** (optional):
```typescript
function getMetricDescription(metricName: string): string | undefined {
  const descriptions: Record<string, string> = {
    // ... existing descriptions
    custom_metric: 'Description of custom metric'
  }
  return descriptions[metricName]
}
```

### Theming

All colors use TailwindCSS utilities and support dark mode automatically:

```tsx
// Light: bg-blue-50
// Dark:  dark:bg-blue-900/20
```

To customize colors, modify Tailwind config:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'hvac-primary': '#...',
      'hvac-secondary': '#...',
    }
  }
}
```

---

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile**: iOS Safari, Chrome Mobile
- **Animations**: Graceful degradation for browsers without animation support
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

---

## Dependencies

```json
{
  "framer-motion": "^11.3.0",
  "react": "^18.3.1",
  "tailwindcss": "^3.4.4"
}
```

---

## Testing

### Manual Testing Checklist

- [ ] All severity levels display correctly
- [ ] Animations play smoothly (60fps)
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Copy buttons work
- [ ] JSON toggle expands/collapses
- [ ] Hover effects trigger
- [ ] Screen reader accessible
- [ ] No layout shift during load

### Test Data

Use `backend/example-usage.ts` for test data generation.

---

## Future Enhancements

1. **Export Functionality**: PDF report generation
2. **Print Styles**: Optimized print layout
3. **Comparison Mode**: Side-by-side diagnostic comparison
4. **Historical Charts**: Metric trends over time
5. **Annotations**: User notes on results
6. **Sharing**: Generate shareable diagnostic links
7. **Mobile Gestures**: Swipe navigation on mobile
8. **Accessibility**: ARIA live regions for dynamic updates

---

## Troubleshooting

### Issue: Animations not playing

**Solution**: Ensure Framer Motion is installed:
```bash
npm install framer-motion
```

### Issue: Colors not showing

**Solution**: Verify Tailwind is processing the component files:
```javascript
// tailwind.config.js
content: [
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

### Issue: Dashboard too slow

**Solution**: Add React.memo for expensive components:
```typescript
export default React.memo(DiagnosticResultCard)
```

### Issue: Dark mode not working

**Solution**: Ensure dark mode is enabled in Tailwind:
```javascript
// tailwind.config.js
darkMode: 'media', // or 'class'
```

---

## Summary

The dashboard provides a production-ready, animated, and professional interface for displaying HVAC diagnostic results. All components are:

✅ Fully typed with TypeScript
✅ Animated with Framer Motion
✅ Styled with TailwindCSS
✅ Dark mode compatible
✅ Mobile responsive
✅ Accessibility compliant
✅ Performance optimized

Ready for production deployment!
