# 🚀 Fatigue-Aware Gesture Control System

A production-ready, real-time web application for gesture-based interaction with automatic fatigue detection and adaptive UI adjustments.

![System Architecture](https://img.shields.io/badge/Stack-Full--Stack-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-cyan)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![AI](https://img.shields.io/badge/AI-MediaPipe%20Hands-orange)

## 📋 Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Gesture Controls](#gesture-controls)
- [Modules](#modules)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Performance](#performance)
- [Research & Commercial Use](#research--commercial-use)

## ✨ Features

### Core Functionality
- **Real-time Hand Tracking**: MediaPipe Hands for accurate hand landmark detection
- **Gesture Recognition**: 7+ gesture types (pinch, fist, swipe, palm, hover)
- **Fatigue Detection**: Automatic monitoring with manual override capability
- **Adaptive UI**: Dynamic button sizing, hover delays, and jitter tolerance
- **Multi-Module System**: Calculator, To-Do List, and Analytics dashboard
- **Authentication**: JWT-based auth with guest mode support
- **Analytics**: Comprehensive interaction logging and performance metrics

### Technical Highlights
- Production-grade architecture with separation of concerns
- Real-time gesture processing with jitter smoothing
- Cooldown timers to prevent gesture spam
- Database persistence for logged-in users
- Session-only storage for guest users
- Responsive design with Tailwind CSS
- CORS, rate limiting, and security hardening

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React +   │  │  MediaPipe   │  │   Fatigue    │       │
│  │    Vite     │  │    Hands     │  │   Engine     │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
│         │                │                   │               │
│         └────────────────┴───────────────────┘               │
│                          │                                   │
│                    WebSocket/HTTP                            │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                          │          BACKEND                  │
│                     ┌────▼────┐                              │
│                     │ Express │                              │
│                     │  API    │                              │
│                     └────┬────┘                              │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         │                │                │                 │
│    ┌────▼────┐    ┌─────▼─────┐   ┌─────▼──────┐           │
│    │  Auth   │    │  Session  │   │ Analytics  │           │
│    │ Service │    │  Service  │   │  Service   │           │
│    └────┬────┘    └─────┬─────┘   └─────┬──────┘           │
│         └───────────────┼───────────────┘                   │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │PostgreSQL │
                    │ Database  │
                    └───────────┘
```

## 📦 Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **PostgreSQL** 14.x or higher
- Modern web browser with webcam (Chrome 90+, Firefox 88+, Safari 14.1+)
- Camera permissions enabled

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd gesture-fatigue-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb gesture_fatigue_db

# Initialize schema
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm run init-db
```

### 3. Start Development Servers

```bash
# Terminal 1: Start backend (from backend/)
npm run dev

# Terminal 2: Start frontend (from frontend/)
npm run dev
```

### 4. Access Application

Open your browser to `http://localhost:5173`

## 🛠️ Detailed Setup

### Backend Configuration (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/gesture_fatigue_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Configuration

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

## 👋 Gesture Controls

### Basic Gestures

| Gesture | Action | Use Case |
|---------|--------|----------|
| **Palm Movement** | Move virtual cursor | Navigation |
| **Hover** | Select element | Hold cursor over button |
| **Pinch** | Execute action | Confirm selection (thumb + index) |
| **Fist** | Drag/Reorder | Grab and move items |
| **Open Palm** | Open controls | Access fatigue settings |
| **Swipe Left** | Delete/Remove | Remove items |
| **Swipe Right** | Add/Select | Add items |
| **Swipe Up/Down** | Adjust levels | Change fatigue level |

### Fatigue-Adaptive Behavior

The system automatically adjusts based on detected fatigue:

| Fatigue Level | Button Size | Hover Delay | Jitter Tolerance |
|---------------|-------------|-------------|------------------|
| **Low** | 1.0x | 400ms | 0.02 |
| **Medium** | 1.2x | 300ms | 0.04 |
| **High** | 1.5x | 200ms | 0.06 |

## 📱 Modules

### 1. Calculator Module
- Gesture-controlled number input
- Operator selection via hover
- Pinch to evaluate (=)
- Clear function
- Adaptive button sizing

### 2. To-Do List Module
- **Task Pool**: Reusable task templates
- **Active Tasks**: Current working list
- Swipe right to add tasks
- Swipe left to delete
- Pinch to mark complete
- Fist to reorder
- Voice-to-text input (Web Speech API)

### 3. Analytics Dashboard
- Real-time session statistics
- Gesture performance metrics
- Fatigue progression charts
- Adaptive vs non-adaptive comparison
- Historical data (logged-in users)
- Session filtering and analysis

## 🌐 Deployment

### Frontend Deployment (Vercel)

```bash
cd frontend
npm run build

# Deploy to Vercel
vercel deploy --prod
```

Environment variables:
- `VITE_API_URL`: Your backend API URL

### Backend Deployment (Render/Railway)

```bash
# Push to GitHub/GitLab
git push origin main

# Connect to Render/Railway
# Set environment variables in dashboard
```

Required environment variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`
- `NODE_ENV=production`

### Database Deployment (Supabase/Railway)

1. Create PostgreSQL instance
2. Copy DATABASE_URL
3. Run schema initialization:

```bash
npm run init-db
```

## 📡 API Documentation

### Authentication Endpoints

#### POST /api/auth/signup
Create new user account

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "token": "jwt-token-here"
}
```

#### POST /api/auth/login
Authenticate user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { "id": 1, "email": "user@example.com" },
  "token": "jwt-token-here"
}
```

### Session Endpoints

#### POST /api/session/start
Start new interaction session

**Request:**
```json
{
  "sessionType": "authenticated",
  "adaptiveMode": true
}
```

**Response:**
```json
{
  "message": "Session started",
  "session": {
    "id": 123,
    "userId": 1,
    "sessionType": "authenticated",
    "startTime": "2026-02-16T10:30:00.000Z",
    "adaptiveMode": true
  }
}
```

### Analytics Endpoints

#### POST /api/analytics/log/gesture
Log gesture event

**Request:**
```json
{
  "sessionId": 123,
  "gestureType": "pinch",
  "successFlag": true,
  "fatigueLevel": "medium",
  "moduleName": "calculator"
}
```

#### GET /api/analytics/session/:sessionId
Get comprehensive session analytics

**Response:**
```json
{
  "session": { ... },
  "gestureStats": [ ... ],
  "fatigueProgression": [ ... ],
  "moduleUsage": [ ... ]
}
```

## 🔒 Security

### Implemented Security Measures

1. **Authentication**: JWT with configurable expiration
2. **Password Hashing**: bcrypt with 12 salt rounds
3. **CORS Protection**: Whitelist-based origin validation
4. **Rate Limiting**: 100 requests per 15 minutes
5. **Helmet**: Security headers (XSS, CSP, etc.)
6. **Input Validation**: express-validator for all inputs
7. **SQL Injection Prevention**: Parameterized queries
8. **HTTPS Ready**: Production configuration included

## ⚡ Performance

### Optimizations

- **Code Splitting**: Separate chunks for MediaPipe, charts, vendor
- **Lazy Loading**: Dynamic module loading
- **Debouncing**: Fatigue updates every 2 seconds
- **Jitter Smoothing**: Moving average filter (3-frame window)
- **Gesture Cooldown**: 500ms between same gesture
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Max 20 PostgreSQL connections

### Performance Metrics

- **Gesture Latency**: < 100ms from detection to action
- **Frame Rate**: 30 FPS hand tracking
- **UI Response**: < 50ms adaptive parameter updates
- **Database Queries**: < 100ms average response time

## 📊 Research & Commercial Use

### Research Features

- Comprehensive analytics collection
- A/B testing framework (adaptive vs non-adaptive)
- Session replay capability
- Statistical datasets for analysis
- Exportable CSV/JSON data
- Fatigue progression tracking
- Gesture performance metrics

### Commercial Features

- Scalable microservices architecture
- Multi-tenant ready (user isolation)
- Production-grade error handling
- Monitoring and logging hooks
- Health check endpoints
- Graceful degradation
- Environment-based configuration
- Zero-downtime deployment ready

## 📄 License

This project is provided for academic research and commercial prototype development.

## 🤝 Contributing

This is a complete, production-ready system. For modifications:

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📞 Support

For issues or questions:
- Check FULL_IMPLEMENTATION.md for detailed docs
- Review API documentation above
- Check browser console for errors
- Verify database connection
- Ensure camera permissions granted

## 🎯 Future Enhancements

Potential additions:
- WebSocket for real-time multi-user collaboration
- Machine learning for gesture personalization
- Advanced analytics with TensorFlow.js
- Mobile app (React Native)
- Voice command integration
- Multi-language support
- Accessibility features (screen reader integration)

---

**Built with ❤️ for HCI research and commercial deployment**
