# FieldLink - HVAC Diagnostic Platform

AI-powered diagnostic assistant for HVAC technicians.

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion
- **Backend**: Express, Prisma ORM, SQLite
- **AI**: Google Gemini API (gemini-3-flash-preview)
- **Auth**: JWT tokens with role-based access (admin/technician)

## Commands

```bash
npm run dev          # Start both frontend (3000) and backend (4000)
npm run build        # Build frontend for production
cd backend && npx prisma studio  # Open database GUI
cd backend && npx prisma migrate dev  # Run migrations
```

## Project Structure

```
frontend/src/
├── components/enhanced/   # NEW: Industrial Control Room UI (active)
├── components/            # Original UI components
├── contexts/              # AuthContext for authentication
├── types/                 # TypeScript interfaces
└── main.tsx              # Switch between original/enhanced UI here

backend/src/
├── server.ts             # Express API routes
├── aiService.ts          # Gemini AI integration
└── prisma/               # Database schema & migrations
```

## Current UI State

- Enhanced UI is **active** (Industrial Control Room aesthetic)
- To switch back: Edit `frontend/src/main.tsx` and change import to `'./App'`
- Design: Copper/orange (#f5a623) + utility blue (#4a90d9)
- Fonts: Bebas Neue (headers), IBM Plex Mono (data), Rajdhani (body)

## Code Conventions

- Use TypeScript for all new code
- Prefer Framer Motion for animations
- Enhanced components go in `frontend/src/components/enhanced/`
- Keep original components untouched for easy rollback
- API endpoints follow REST conventions at `/api/*`

## Key Files

- @frontend/src/components/enhanced/AppEnhanced.tsx - Main enhanced app wrapper
- @frontend/src/components/enhanced/AIChatPageEnhanced.tsx - Sensei chat with typewriter effect
- @backend/src/server.ts - All API endpoints
- @backend/src/aiService.ts - Gemini prompts and API calls
- @backend/prisma/schema.prisma - Database models

## Database Models

- **User**: Authentication (email, password, role)
- **AdminSettings**: Gemini API key, selected model
- **Diagnostic**: Saved diagnostic results with readings

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/diagnostics/ai` - Run AI diagnostic analysis
- `POST /api/chat/message` - Sensei AI chat (streaming)
- `GET /api/diagnostics/history` - User's diagnostic history
- `GET /api/admin/settings` - Admin configuration
