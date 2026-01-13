# FieldLink - Field Service Management Platform

A full-stack field service management platform with AI-powered diagnostics, user authentication, admin dashboard, and Sensei AI chat assistant. Built with React + Vite frontend, Express backend, and Prisma + SQLite database.

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Framer Motion (animations)
- Inter Font (Google Fonts)

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- SQLite Database
- JWT Authentication
- bcrypt (password hashing)
- AES-256-CBC encryption (API keys)

### AI Integration
- OpenRouter API
- Dynamic model selection (100+ models)
- Multiple AI providers supported (Claude, GPT, Gemini, etc.)
- Vision model support for image analysis
- Streaming responses with Server-Sent Events (SSE)

## Project Structure

```
FieldLink/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx          # Main application component
│   │   ├── components/       # React components
│   │   │   ├── DiagnosticsInputPage.tsx
│   │   │   ├── UserHistory.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AIChatPage.tsx (Sensei AI Assistant)
│   │   │   ├── DraftsPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── ...
│   │   ├── contexts/         # React contexts (Auth)
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   └── main.tsx         # Application entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── index.html
├── backend/                  # Express API server
│   ├── src/
│   │   └── server.ts        # API server with all endpoints
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── seed.ts          # Database seeding
│   │   └── migrations/      # Database migrations
│   ├── package.json
│   └── tsconfig.json
└── package.json             # Root package with scripts
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Bucksibi/FieldLink.git
cd FieldLink
```

2. Install all dependencies (root, frontend, and backend):
```bash
npm run install:all
```

3. Set up the database:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run seed  # Creates test users
cd ..
```

Test credentials will be created:
- **Admin:** admin@fieldlink.com / admin123
- **User:** user@fieldlink.com / user123

### Development

Run both frontend and backend concurrently:
```bash
npm run dev
```

This will start:
- Frontend at `http://localhost:3000`
- Backend API at `http://localhost:4000`

Or run them separately:
```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

### Production Build

Build both frontend and backend:
```bash
npm run build
```

### Start Production Server

After building, start the production backend server:
```bash
npm start
```

## Features

### Core Functionality
- **AI-Powered Diagnostics**: Advanced system analysis using multiple AI models
- **Dynamic Readings Input**: Flexible data entry with validation
- **Multiple System Types**: Support for various equipment configurations
- **Troubleshooting Modes**: Targeted diagnostics for specific issues

### Sensei AI Chat Assistant
- **Conversational AI**: Chat interface for troubleshooting guidance
- **Streaming Responses**: Real-time response rendering
- **Voice Input**: Speech-to-text for hands-free operation
- **File & Image Upload**: Attach photos and documents
- **Vision Analysis**: Visual diagnostics with image analysis
- **Persistent History**: Chat conversations saved locally

### User Management
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access**: Regular users and administrators
- **Diagnostic History**: View and filter past records

### Admin Features
- **Admin Dashboard**: View all records across users
- **System Configuration**: Configure API keys and AI models
- **Encrypted Storage**: AES-256-CBC encrypted API keys
- **Model Management**: Select from 100+ available AI models

### UI/UX
- **Dark Theme**: Modern dark mode interface
- **Glassmorphism**: Frosted glass card effects
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Design**: Mobile-first layout
- **Premium Navigation**: Frosted glass navbar

## API Endpoints

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login - User login
GET /api/auth/me - Get current user info
```

### Diagnostics
```
POST /api/diagnostics - Run diagnostic analysis
GET /api/diagnostics/history - Get user's diagnostic history
GET /api/diagnostics/:id - Get specific diagnostic
DELETE /api/diagnostics/:id - Delete diagnostic
```

### Admin
```
GET /api/admin/diagnostics - Get all diagnostics (admin only)
GET /api/admin/settings - Get system configuration
POST /api/admin/settings - Update system configuration
```

### AI Chat
```
POST /api/chat/message - Send chat message with streaming response
GET /api/system-config - Check system configuration status
```

### Health Check
```
GET /health - API health status
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```
PORT=4000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key
```

## Documentation

- **[AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)**: Authentication system docs
- **[AI_SERVICE_README.md](./backend/AI_SERVICE_README.md)**: AI service integration
- **[DASHBOARD_GUIDE.md](./DASHBOARD_GUIDE.md)**: Dashboard components
- **[FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)**: Frontend components guide
- **[TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md)**: Technical architecture

## License

MIT
