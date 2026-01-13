# QuickCheck HVAC - Development Notes

**Last Updated:** 2025-10-17

## Project Overview
QuickCheck HVAC is a professional diagnostic assistant application for HVAC technicians. It uses AI (via OpenRouter API) to analyze HVAC system readings and provide diagnostic recommendations.

## Recent Work Completed

### Session Summary (2025-10-17)

#### 1. UI/UX Enhancements - DataInputForm Component
**Location:** `/frontend/src/components/DataInputForm.tsx`

Implemented major mobile-first UX improvements for field technician use:

**A. Larger Touch Targets (48x48px minimum)**
- All input fields: `minHeight: 48px` with `px-4 py-3` padding
- "Add Reading" button: full-width on mobile, 48px height
- Plus/minus stepper buttons: 48x48px for glove-friendly use
- Remove button: larger with better visibility
- Added `touch-manipulation` CSS class for better mobile performance

**B. Inline Validation Icons**
- Green checkmark (emerald) for valid fields
- Red exclamation (rose) for errors
- Yellow warning (amber) for warnings
- Icons appear inside input fields on the right side
- Color-coded borders for immediate visual feedback

**C. Unit Labels Inside Inputs**
- Unit label (°F, PSI, CFM, etc.) now displays inside the value input field
- Pill-style badge design with background color
- Unit selector hidden on mobile to save space (visible on desktop)
- Users can still change units via desktop view or the unit dropdown on larger screens

**D. Number Steppers for Quick Adjustments**
- Plus (+) and minus (−) buttons on either side of value input
- Smart step sizes based on unit type:
  - Temperature (°F/°C): 1 degree increments
  - Pressure (PSI/kPa): 1-5 units depending on magnitude (>100 = 5, else 1)
  - Airflow (CFM/L/s): 10-50 units depending on magnitude (>1000 = 50, else 10)
  - Voltage (V): 1-10 units depending on magnitude (>100 = 10, else 1)
  - Amperage (A): 0.1-1 units depending on magnitude (>10 = 1, else 0.1)
- Large, touch-friendly buttons perfect for glove use
- Disabled when field is empty or invalid

**E. Modern Color Scheme**
Replaced gray-based colors with contemporary slate/emerald/rose/amber palette:

- **Slate** (replacing gray): More sophisticated base colors
  - Borders: `border-slate-200`, `border-slate-300`, `dark:border-slate-600`
  - Backgrounds: `bg-slate-100`, `dark:bg-slate-700/50`, `dark:bg-slate-800/50`
  - Text: `text-slate-500`, `text-slate-600`, `dark:text-slate-300`

- **Emerald** (green) for valid states: `text-emerald-500`, `border-emerald-400`, `bg-emerald-50/30`
- **Rose** (red) for errors: `text-rose-500`, `border-rose-400`, `bg-rose-50`
- **Amber** (yellow-orange) for warnings: `text-amber-500`, `border-amber-400`, `bg-amber-50`
- **Blue gradient** for "Add Reading" button: `bg-gradient-to-r from-blue-600 to-blue-700`

**F. Refined Styling Elements**
- Rounded corners: Changed from `rounded-lg` to `rounded-xl` for softer edges
- Transitions: Added `transition-all duration-200` for smooth animations
- Shadows: Added `shadow-sm hover:shadow` on stepper buttons
- Borders: Added borders to validation messages for better definition
- Typography: Increased font weights (`font-semibold`, `font-medium`, `font-bold`)

#### 2. Navigation Enhancement
**Location:** `/frontend/src/App.tsx`

Made the "QuickCheck HVAC" title in the navigation bar clickable:
- Clicking the title navigates to the diagnostics screen
- Hover effect: text changes to blue (`hover:text-blue-600`)
- Tooltip: "Go to Diagnostics"
- Common UX pattern (logo/title as "home" button)

## Current Application State

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite (port 5173)
- **Backend:** Node.js + Express + TypeScript (port 4000)
- **Database:** Prisma ORM with SQLite
- **Authentication:** JWT with role-based access control (admin/user)
- **AI Service:** OpenRouter API (centrally managed)
- **Styling:** TailwindCSS + Framer Motion
- **Build Tools:** tsx watch for backend hot reload

### Key Features Implemented

1. **Centralized API Key Management**
   - Admin-only system settings (API key + model selection)
   - AES-256-CBC encryption for API key storage
   - Backend proxy for fetching available models (avoids CORS)
   - System status indicator (✓ or ✗) on diagnostic page

2. **User Roles**
   - **Admin:** Full access to system settings, diagnostic records, user management
   - **User:** Access to diagnostics and their own history

3. **Diagnostic System**
   - Input fields for location, equipment details, system type, refrigerant
   - Dynamic system readings with validation
   - AI-powered diagnostic analysis
   - Results dashboard with recommendations
   - Print functionality for diagnostic reports

4. **Security Features**
   - JWT authentication
   - Rate limiting on diagnostic endpoints
   - Input validation and sanitization
   - Encrypted API key storage
   - CORS configuration (currently allowing all origins in development)

### File Structure

```
hvac-diagnostic-app/
├── backend/
│   ├── src/
│   │   └── server.ts          # Main Express server, all API endpoints
│   ├── prisma/
│   │   └── schema.prisma      # Database schema (User, DiagnosticRecord, SystemSettings)
│   └── dist/                  # Compiled JavaScript
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main app with navigation (diagnostics/history/admin)
│   │   ├── components/
│   │   │   ├── DiagnosticsInputPage.tsx    # Main diagnostic page
│   │   │   ├── DataInputForm.tsx           # Enhanced form with steppers & validation
│   │   │   ├── AdminDashboard.tsx          # Admin settings & diagnostic records
│   │   │   ├── UserHistory.tsx             # User's diagnostic history
│   │   │   ├── ResultsDashboard.tsx        # Diagnostic results display
│   │   │   ├── SystemSelector.tsx          # System type dropdown
│   │   │   ├── RefrigerantInput.tsx        # Refrigerant input field
│   │   │   └── LoginPage.tsx               # Authentication page
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx             # Auth state management
│   │   ├── utils/
│   │   │   ├── validation.ts               # Input validation logic
│   │   │   ├── unitConversion.ts           # Unit standardization
│   │   │   └── printDiagnostic.ts          # Print functionality
│   │   └── types.ts                        # TypeScript type definitions
│   └── ...
└── DEVELOPMENT_NOTES.md       # This file
```

## Known Issues / Technical Debt

1. **CORS Configuration**
   - Currently allows all origins in development (`origin: true`)
   - Should be restricted to specific origins in production

2. **Unit Selector on Mobile**
   - Hidden on mobile screens to save space
   - Users see unit inside input but can't change it on mobile
   - Consider adding a modal or dropdown for mobile unit selection

3. **Form Validation**
   - Validation works well but could be more user-friendly
   - Consider adding real-time validation as user types

4. **Error Handling**
   - Basic error handling in place
   - Could be more specific about error types and recovery options

## Environment Setup

### Backend
```bash
cd backend
npm install
npm run dev  # Starts tsx watch on port 4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Starts Vite dev server on port 5173
```

### Environment Variables
**Backend `.env`:**
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
ENCRYPTION_KEY="your-encryption-key-hex"
ALLOWED_ORIGINS="http://localhost:5173"
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Diagnostics
- `POST /api/diagnostics/ai` - Run AI diagnostic analysis (authenticated)
- `GET /api/diagnostics/user` - Get user's diagnostic history (authenticated)
- `GET /api/system-config` - Check if system is configured (authenticated)

### Admin
- `GET /api/admin/settings` - Get system settings (admin only)
- `POST /api/admin/settings` - Update system settings (admin only)
- `POST /api/admin/fetch-models` - Fetch available models from OpenRouter (admin only)
- `GET /api/admin/diagnostics` - Get all diagnostic records (admin only)

## Next Steps / Potential Improvements

### High Priority
1. **Mobile Unit Selection**
   - Add modal or bottom sheet for changing units on mobile devices
   - Maintain the clean inline display while allowing changes

2. **Production CORS**
   - Configure proper CORS origins for production deployment
   - Add environment-specific configuration

3. **Error Recovery**
   - Add retry mechanism for failed API calls
   - Better offline handling
   - More specific error messages

### Medium Priority
4. **Performance Optimization**
   - Add caching for frequently accessed data
   - Optimize AI API calls (consider batching)
   - Lazy load components

5. **Additional UX Enhancements**
   - Add keyboard shortcuts for power users
   - Implement autosave for diagnostic forms
   - Add confirmation dialogs for destructive actions

6. **Testing**
   - Add unit tests for validation logic
   - Add integration tests for API endpoints
   - Add E2E tests for critical user flows

### Low Priority
7. **Features**
   - Export diagnostic reports to PDF
   - Email diagnostic reports to customers
   - Add diagnostic templates for common scenarios
   - Multi-language support

8. **Analytics**
   - Track common diagnostic patterns
   - Monitor AI model performance
   - Usage statistics for admins

## Design Philosophy

### Mobile-First Approach
- All interfaces designed for field technicians working outdoors
- Glove-friendly touch targets (48x48px minimum)
- High contrast colors for outdoor visibility
- One-handed operation where possible
- Progressive enhancement for desktop users

### Visual Hierarchy
- Modern, clean aesthetic with slate-based color palette
- Clear validation states (emerald/rose/amber)
- Smooth transitions and animations
- Consistent spacing and typography

### User Experience
- Minimal cognitive load - clear labels and instructions
- Immediate feedback on user actions
- Smart defaults and auto-suggestions
- Forgiving input validation (warnings vs errors)

## Common Tasks

### Add a New Input Field
1. Update `DiagnosticResult` type in `/frontend/src/types.ts`
2. Add field to request body in `DiagnosticsInputPage.tsx`
3. Update backend validation in `/backend/src/server.ts`
4. Update Prisma schema if persisting the field
5. Run `npx prisma migrate dev` if schema changed

### Add a New API Endpoint
1. Add route in `/backend/src/server.ts`
2. Add authentication middleware if needed (`authenticate`, `requireAdmin`)
3. Add validation with `express-validator`
4. Update frontend service call in appropriate component

### Change AI Model
1. Login as admin
2. Navigate to Admin → System Settings
3. Enter/update OpenRouter API key
4. Click "Validate & Load Models"
5. Select desired model from dropdown
6. Click "Save Settings"

## Troubleshooting

### Backend won't start
- Check if port 4000 is already in use: `lsof -ti:4000`
- Kill process: `kill -9 $(lsof -ti:4000)`
- Check environment variables in `.env`

### Frontend won't connect to backend
- Verify backend is running on port 4000
- Check CORS configuration in `server.ts`
- Check browser console for errors

### Database issues
- Reset database: `rm backend/prisma/dev.db`
- Run migrations: `cd backend && npx prisma migrate dev`
- Seed admin user: Check `prisma/seed.ts`

### AI diagnostics failing
- Verify system is configured (Admin → System Settings)
- Check API key is valid in OpenRouter
- Check backend logs: `/tmp/backend.log`
- Verify model ID is correct

## Contact & Resources

- OpenRouter API Docs: https://openrouter.ai/docs
- Prisma Docs: https://www.prisma.io/docs
- TailwindCSS Docs: https://tailwindcss.com/docs
- React Docs: https://react.dev

---

**Note:** This file should be updated whenever significant changes are made to the project. Keep it current so the next developer can quickly understand the project state.
