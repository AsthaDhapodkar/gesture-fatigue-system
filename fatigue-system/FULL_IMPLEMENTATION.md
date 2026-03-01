# Fatigue-Aware Gesture Control System - Complete Implementation Guide

## Project Overview
This is a production-ready, real-time gesture-controlled web application with fatigue detection.

## Architecture

### Backend (Node.js + Express + PostgreSQL)
- JWT-based authentication
- Session management
- Real-time analytics logging
- RESTful API endpoints

### Frontend (React + Vite + MediaPipe)
- Gesture recognition via webcam
- Fatigue detection engine
- Calculator module
- To-Do list module
- Analytics dashboard
- Responsive UI with Tailwind CSS

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Modern web browser with webcam

### Database Setup
1. Create PostgreSQL database:
```bash
createdb gesture_fatigue_db
```

2. Update backend/.env with your database credentials:
```
DATABASE_URL=postgresql://username:password@localhost:5432/gesture_fatigue_db
```

3. Initialize database schema:
```bash
cd backend
npm install
npm run init-db
```

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

Server runs on http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## API Endpoints

### Authentication
- POST /api/auth/signup - Create account
- POST /api/auth/login - User login
- GET /api/auth/verify - Verify JWT token

### Session Management  
- POST /api/session/start - Start new session
- POST /api/session/end - End session
- GET /api/session/active - Get active sessions

### Analytics
- POST /api/analytics/log/gesture - Log gesture event
- POST /api/analytics/log/fatigue - Log fatigue state
- POST /api/analytics/log/module - Log module usage
- GET /api/analytics/session/:id - Get session analytics
- GET /api/analytics/history - Get historical analytics (auth required)

## Gesture System

### Supported Gestures
1. **Palm Movement** - Cursor control
2. **Hover** - Element selection (hold cursor)
3. **Pinch** - Execute action (thumb + index)
4. **Fist** - Reorder/drag
5. **Open Palm** - Open fatigue control
6. **Swipe Left/Right** - Navigation
7. **Swipe Up/Down** - Adjust fatigue level

### Fatigue Detection
Automatic monitoring of:
- Hand movement speed degradation
- Landmark jitter variance
- Failed gesture count
- Hover stabilization time

Adaptive UI adjustments:
- Button size scaling
- Hover delay reduction
- Jitter tolerance increase
- Swipe threshold adjustment

## Modules

### Calculator
- Gesture-controlled number input
- Operator selection
- Pinch to evaluate
- Fatigue-adaptive button sizing

### To-Do List
- Task pool system (create once, reuse)
- Swipe right to add task
- Swipe left to delete
- Pinch to mark complete
- Fist to reorder
- Voice-to-text input (Web Speech API)

### Analytics Dashboard
- Usage statistics
- Gesture performance metrics
- Fatigue progression charts
- Adaptive vs non-adaptive comparison
- Session filtering (for logged-in users)

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel or Netlify
```

Environment variables needed:
- VITE_API_URL=https://your-backend-url.com/api

### Backend (Render/Railway)
```bash
cd backend
# Deploy to Render or Railway
```

Environment variables needed:
- DATABASE_URL
- JWT_SECRET
- ALLOWED_ORIGINS
- NODE_ENV=production

### Database (Supabase/Railway)
- Use managed PostgreSQL service
- Update DATABASE_URL in backend environment

## Security Features
- Bcrypt password hashing (12 rounds)
- JWT token authentication
- CORS protection
- Rate limiting (100 req/15min)
- Helmet security headers
- Input validation
- HTTPS-ready

## File Structure Summary

```
gesture-fatigue-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── sessionController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── sessionRoutes.js
│   │   └── analyticsRoutes.js
│   ├── scripts/
│   │   └── initDb.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── GestureCanvas.jsx
    │   │   ├── VirtualCursor.jsx
    │   │   ├── FatigueIndicator.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── Calculator.jsx
    │   │   ├── TodoList.jsx
    │   │   └── Analytics.jsx
    │   ├── context/
    │   │   └── AppContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   └── AppShell.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── utils/
    │   │   ├── gestureUtils.js
    │   │   └── fatigueEngine.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

## Development Notes

### MediaPipe Integration
- Uses CDN-hosted models for faster loading
- Optimized for single-hand detection
- 640x480 video resolution for balance of performance/accuracy

### Performance Optimizations
- Code splitting for MediaPipe libraries
- Lazy loading of modules
- Debounced fatigue updates (2s interval)
- Moving average filters for jitter reduction
- Gesture cooldown timers (500ms)

### Browser Compatibility
- Chrome/Edge 90+ (recommended)
- Firefox 88+
- Safari 14.1+
- Requires webcam permission

## Research Publication Ready
This implementation includes:
- Comprehensive analytics collection
- A/B testing framework (adaptive vs non-adaptive)
- Session replay capability
- Statistical significance testing data
- Exportable datasets for analysis

## Commercial Deployment Ready
Production features:
- Scalable architecture
- Database connection pooling
- Error handling and logging
- Rate limiting
- Security hardening
- Environment-based configuration
- Health check endpoints
- Graceful error recovery

