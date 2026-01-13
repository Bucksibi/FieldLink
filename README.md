# FieldLink - AI-Powered HVAC Diagnostic Platform

A full-stack field service management platform with AI-powered HVAC diagnostics, Sensei AI chat assistant, user authentication, and admin dashboard. Built with React + Vite frontend, Express backend, Prisma + SQLite database, and Google Gemini AI.

## Features

### AI-Powered Diagnostics
- **Intelligent System Analysis**: Advanced HVAC diagnostics using Google Gemini 3 Flash
- **Multiple System Types**: Support for split systems, packaged units, heat pumps, and dual fuel
- **Performance Metrics**: Automatic calculation of superheat, subcooling, delta T, and efficiency ratings
- **Fault Detection**: AI identifies issues with severity levels (critical, warning, info)

### Sensei AI Chat Assistant
- **Conversational AI**: Chat interface for HVAC troubleshooting guidance
- **Streaming Responses**: Real-time response rendering
- **Voice Input**: Speech-to-text for hands-free operation
- **Image Analysis**: Upload photos for visual equipment diagnostics (multimodal)
- **Persistent History**: Chat conversations saved locally

### User & Admin Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Technicians and administrators
- **Diagnostic History**: View and filter past diagnostic records
- **Admin Dashboard**: Manage users, view all records, configure AI settings

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Framer Motion (animations)

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM with SQLite
- JWT Authentication
- AES-256-CBC encryption (API keys)

### AI Integration
- **Google Gemini API** (FREE tier)
- Gemini 3 Flash Preview (default)
- Multimodal support (text + images)
- 1M token context window
- Streaming responses

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Google Gemini API key (free)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Bucksibi/FieldLink.git
cd FieldLink
```

2. Install all dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key
```

4. Set up the database:
```bash
cd backend
npx prisma generate
npx prisma migrate dev
npm run seed  # Creates test users
cd ..
```

Test credentials:
- **Admin:** admin@hvac-diagnostic.com / admin123
- **User:** user@hvac-diagnostic.com / user123

### Get Your FREE Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

The free tier includes:
- Gemini 3 Flash Preview (latest)
- Gemini 2.5 Flash
- Gemini 2.5 Pro
- 1 million token context window
- Multimodal support (text, images, video, audio)

### Development

Run both frontend and backend:
```bash
npm run dev
```

This starts:
- Frontend at `http://localhost:3000`
- Backend API at `http://localhost:4000`

### Configure AI (First Time Setup)

1. Log in as admin (admin@hvac-diagnostic.com / admin123)
2. Go to Admin Dashboard > System Settings
3. Enter your Gemini API key
4. Click "Load Models" and select a model
5. Save settings

## Project Structure

```
FieldLink/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── DiagnosticsInputPage.tsx
│   │   │   ├── AIChatPage.tsx (Sensei AI)
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── ...
│   │   ├── contexts/         # React contexts
│   │   ├── types/           # TypeScript types
│   │   └── main.tsx
│   └── package.json
├── backend/                  # Express API server
│   ├── src/
│   │   ├── server.ts        # API endpoints
│   │   ├── aiService.ts     # Gemini AI integration
│   │   ├── auth.ts          # Authentication
│   │   └── types.ts         # Backend types
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/
│   └── package.json
└── package.json             # Root scripts
```

## API Endpoints

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login    - User login
GET  /api/auth/me       - Get current user
```

### Diagnostics
```
POST /api/diagnostics/ai     - Run AI diagnostic analysis
GET  /api/diagnostics/history - Get user's history
DELETE /api/diagnostics/:id  - Delete diagnostic
```

### Admin
```
GET  /api/admin/settings     - Get system configuration
POST /api/admin/settings     - Update configuration
GET  /api/admin/models       - Get available Gemini models
GET  /api/admin/diagnostics  - Get all diagnostics
```

### Chat (Sensei AI)
```
POST /api/chat/message - Send chat message (streaming)
```

### System
```
GET /health           - Health check
GET /api/system-types - Get HVAC system types
GET /api/system-config - Get config status
```

## Available Gemini Models

| Model | Description |
|-------|-------------|
| gemini-3-flash-preview | Latest and fastest - FREE |
| gemini-2.5-flash-preview | Fast with excellent reasoning - FREE |
| gemini-2.5-pro-preview | Best quality for complex tasks - FREE |
| gemini-2.0-flash | Stable multimodal release - FREE |

## Production Build

```bash
npm run build    # Build frontend and backend
npm start        # Start production server
```

## License

MIT

---

Built with Google Gemini AI
