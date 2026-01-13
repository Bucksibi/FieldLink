# Authentication System Guide

## Overview

The HVAC Diagnostic App now includes a complete user authentication system with support for regular users and admin users. All diagnostic records are linked to user accounts, and admins can view all diagnostics across all users.

---

## Features

### User Management
- **User Registration**: New users can create accounts with email, password, and name
- **User Login**: Existing users can authenticate with email and password
- **JWT Authentication**: Secure token-based authentication with 7-day expiration
- **Role-Based Access**: Two user roles - `user` and `admin`

### Regular User Features
- Run AI-powered HVAC diagnostics
- View their own diagnostic history
- All diagnostics are automatically saved and linked to their account
- Secure API key storage (client-side only)

### Admin Features
- Access to Admin Dashboard
- View all diagnostic records from all users
- See which user created each diagnostic
- View complete diagnostic details including:
  - User information
  - System configuration
  - Input readings
  - AI model used
  - Full diagnostic results

---

## Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hashed
  name      String
  role      String   @default("user") // "user" or "admin"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  diagnostics DiagnosticRecord[]
}
```

### DiagnosticRecord Model
```prisma
model DiagnosticRecord {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  systemType    String
  refrigerant   String?
  readings      String   // JSON stringified StandardReadings
  userNotes     String?
  modelId       String

  result        String   // JSON stringified DiagnosticResult

  createdAt     DateTime @default(now())
}
```

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "user" // optional, defaults to "user"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token-here"
}
```

#### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token-here"
}
```

#### GET /api/auth/me
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Protected Diagnostic Endpoints

#### POST /api/diagnostics/ai (Protected)
Run AI diagnostic - requires authentication.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "apiKey": "openrouter-api-key",
  "modelId": "anthropic/claude-3.5-sonnet",
  "system_type": "Heat Pump Split System",
  "refrigerant": "R-410A",
  "readings_std": {
    "indoor_temp": 72,
    "outdoor_temp": 85,
    "supply_air_temp": 55
  },
  "user_notes": "Optional technician notes"
}
```

**Response:**
Standard DiagnosticResult object (automatically saved to database)

#### GET /api/diagnostics/history (Protected)
Get current user's diagnostic history.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "diagnostics": [
    {
      "id": "uuid",
      "systemType": "Heat Pump Split System",
      "refrigerant": "R-410A",
      "readings": { "indoor_temp": 72 },
      "userNotes": "Notes",
      "modelId": "anthropic/claude-3.5-sonnet",
      "result": { /* DiagnosticResult */ },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Admin Endpoints

#### GET /api/admin/diagnostics (Admin Only)
Get all diagnostic records from all users.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "diagnostics": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "user"
      },
      "systemType": "Heat Pump Split System",
      "refrigerant": "R-410A",
      "readings": { "indoor_temp": 72 },
      "userNotes": "Notes",
      "modelId": "anthropic/claude-3.5-sonnet",
      "result": { /* DiagnosticResult */ },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

## Frontend Components

### AuthContext (`src/contexts/AuthContext.tsx`)
React context providing authentication state and methods.

**Exported Hook:**
```typescript
const { user, token, login, register, logout, isLoading, error } = useAuth()
```

**Methods:**
- `login(email, password)` - Authenticate user
- `register(email, password, name)` - Create new account
- `logout()` - Clear authentication and local storage

### LoginPage (`src/components/LoginPage.tsx`)
Combined login/registration form with:
- Toggle between login and signup modes
- Email validation
- Password strength requirements (6+ characters)
- Error handling and display
- Auto-redirect on successful authentication

### AdminDashboard (`src/components/AdminDashboard.tsx`)
Admin-only dashboard featuring:
- Table view of all diagnostic records
- User information for each record
- Status indicators (normal, attention_needed, critical)
- Filterable and sortable table
- Detail modal for full record inspection
- View complete input readings and AI results

### Updated App.tsx
Main app component with:
- AuthProvider wrapper
- Login gate (shows LoginPage if not authenticated)
- Navigation bar with user info
- Role-based navigation (admin sees Admin Dashboard tab)
- Logout functionality

### Updated DiagnosticsInputPage
Now includes:
- Automatic token injection in API calls
- Records automatically saved to database
- All diagnostics linked to authenticated user

---

## Security Features

### Password Security
- Passwords hashed with bcrypt (10 salt rounds)
- Never stored or transmitted in plain text
- Minimum 6 character requirement

### Token Security
- JWT tokens signed with secret key
- 7-day expiration
- Stored in localStorage (client-side)
- Validated on every protected API request

### API Protection
- All diagnostic endpoints require authentication
- Admin endpoints check for admin role
- Proper HTTP status codes (401 Unauthorized, 403 Forbidden)

### Database Security
- User passwords bcrypt hashed
- UUID primary keys
- Proper foreign key relationships

---

## Test Credentials

Two test users are automatically created when you run `npm run seed`:

### Admin User
- **Email:** admin@hvac-diagnostic.com
- **Password:** admin123
- **Role:** admin
- **Access:** Full admin dashboard + diagnostics

### Regular User
- **Email:** user@hvac-diagnostic.com
- **Password:** user123
- **Role:** user
- **Access:** Diagnostics only

---

## Setup Instructions

### 1. Database Setup
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

### 2. Environment Variables
Ensure `.env` file in `backend/` contains:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="hvac-diagnostic-app-secret-key-change-in-production"
```

### 3. Start Servers
```bash
# From root directory
npm run dev

# Or individually:
cd backend && npm run dev
cd frontend && npm run dev
```

---

## Usage Flow

### For Regular Users

1. **First Time Users:**
   - Open http://localhost:3000
   - Click "Don't have an account? Sign up"
   - Enter email, password (6+ chars), and full name
   - Automatically logged in after registration

2. **Returning Users:**
   - Open http://localhost:3000
   - Enter email and password
   - Click "Sign In"

3. **Using the App:**
   - Configure OpenRouter API key in ModelManager
   - Select system type and refrigerant
   - Enter system readings
   - Run diagnostics
   - Results automatically saved to your account

4. **Logout:**
   - Click "Logout" button in top-right
   - Returns to login page

### For Admin Users

1. **Login as Admin:**
   - Use admin credentials
   - See "Admin Dashboard" tab in navigation

2. **Admin Dashboard:**
   - Click "Admin Dashboard" tab
   - View table of all diagnostic records
   - See which user created each diagnostic
   - Click "View Details" to see full record

3. **View Details:**
   - Modal shows complete diagnostic information
   - User details (name, email)
   - System configuration
   - All input readings
   - Technician notes
   - AI model used
   - Full diagnostic results (JSON)

---

## File Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Test user seeding
│   └── migrations/            # Database migrations
├── src/
│   ├── auth.ts                # Authentication logic
│   ├── middleware/
│   │   └── authenticate.ts    # Auth middleware
│   ├── server.ts              # Updated with auth endpoints
│   └── types.ts               # TypeScript types
└── .env                       # Environment variables

frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx    # Auth state management
│   ├── components/
│   │   ├── LoginPage.tsx      # Login/signup form
│   │   ├── AdminDashboard.tsx # Admin panel
│   │   └── DiagnosticsInputPage.tsx # Updated for auth
│   ├── App.tsx                # Updated with auth flow
│   └── types/                 # TypeScript types
```

---

## API Response Codes

### Success Codes
- `200 OK` - Successful request
- `201 Created` - User successfully registered

### Error Codes
- `400 Bad Request` - Missing required fields or validation error
- `401 Unauthorized` - Invalid credentials or missing token
- `403 Forbidden` - Valid token but insufficient permissions (not admin)
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

## Development Notes

### Adding New Admin Features
1. Create endpoint in `server.ts` with `authenticate, requireAdmin` middleware
2. Add corresponding UI in `AdminDashboard.tsx`
3. Update API call to include `Authorization: Bearer ${token}` header

### Creating Additional User Roles
1. Update User model in `schema.prisma`
2. Run `npx prisma migrate dev`
3. Add role check in `authenticate.ts` middleware
4. Update frontend to handle new role

### Modifying Token Expiration
In `backend/src/auth.ts`:
```typescript
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }) // Change duration here
}
```

---

## Troubleshooting

### "Authentication required" error
- Ensure you're logged in
- Check that token is stored in localStorage: `localStorage.getItem('hvac_auth_token')`
- Token may be expired (7 days) - login again

### "Forbidden" error on admin endpoint
- Ensure logged-in user has `role: 'admin'`
- Check database: `SELECT * FROM User WHERE email = 'your-email'`

### Database issues
```bash
cd backend
npx prisma migrate reset  # WARNING: Deletes all data
npm run seed              # Recreate test users
```

### Frontend not recognizing auth
- Clear browser localStorage
- Refresh page
- Check browser console for errors

---

## Future Enhancements (Deferred)

The following enhancements were discussed and documented for future implementation:

1. **Email Verification**: Send verification emails on registration
2. **Password Reset**: Forgot password flow with email tokens
3. **2FA (Two-Factor Authentication)**: Optional SMS/app-based 2FA
4. **Session Management**: View and revoke active sessions
5. **Audit Logs**: Track all user actions for security
6. **Rate Limiting**: Prevent brute force attacks
7. **OAuth Integration**: Login with Google, GitHub, etc.
8. **User Profiles**: Allow users to update name, email, password
9. **Diagnostic Sharing**: Share diagnostic reports with other users
10. **Export Features**: Export diagnostic history to PDF/CSV

---

## Summary

The authentication system is fully implemented and functional:

- JWT-based authentication with bcrypt password hashing
- Role-based access control (user/admin)
- Protected API endpoints
- Automatic diagnostic record storage
- Admin dashboard for viewing all diagnostics
- Secure token management
- Test users pre-seeded for development

All diagnostic records are now linked to user accounts, and admins can query all results and see which prompts were made by which user.

**Application URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Database: SQLite at `backend/prisma/dev.db`

Ready for production deployment!
