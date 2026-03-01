# 🚀 Deployment Checklist

## Pre-Deployment

### Backend
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Configure production DATABASE_URL
- [ ] Set NODE_ENV=production
- [ ] Update ALLOWED_ORIGINS with frontend URL
- [ ] Review rate limiting settings
- [ ] Test database connection
- [ ] Run `npm run init-db` on production database

### Frontend
- [ ] Set VITE_API_URL to production backend
- [ ] Run `npm run build` successfully
- [ ] Test build locally with `npm run preview`
- [ ] Verify all environment variables

### Database
- [ ] Create production PostgreSQL instance
- [ ] Configure connection limits
- [ ] Enable SSL/TLS
- [ ] Set up automated backups
- [ ] Create read replicas (if needed)

## Deployment Steps

### Option 1: Vercel (Frontend) + Render (Backend)

#### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Add environment variables:
   - VITE_API_URL
5. Deploy

#### Backend (Render)
1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `backend`
4. Add environment variables:
   - DATABASE_URL
   - JWT_SECRET
   - ALLOWED_ORIGINS
   - NODE_ENV=production
5. Deploy

### Option 2: Railway (Full Stack)

1. Create new project
2. Add PostgreSQL database
3. Add backend service:
   - Root: `backend`
   - Start Command: `npm start`
4. Add frontend service:
   - Root: `frontend`
   - Build: `npm run build`
5. Configure environment variables
6. Deploy

## Post-Deployment

### Testing
- [ ] Test user signup
- [ ] Test user login
- [ ] Test guest mode
- [ ] Verify gesture system initialization
- [ ] Test calculator module
- [ ] Test to-do list module
- [ ] Test analytics dashboard
- [ ] Verify fatigue detection
- [ ] Test manual fatigue override
- [ ] Check database persistence
- [ ] Verify CORS settings
- [ ] Test rate limiting

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Monitor API response times
- [ ] Track database query performance
- [ ] Monitor gesture latency
- [ ] Set up uptime monitoring

### Security
- [ ] Enable HTTPS
- [ ] Review CORS configuration
- [ ] Test rate limiting
- [ ] Verify JWT expiration
- [ ] Check password requirements
- [ ] Review database permissions
- [ ] Enable database SSL

### Performance
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize database queries
- [ ] Set up connection pooling
- [ ] Monitor memory usage
- [ ] Test under load

## Production URLs

- Frontend: https://your-app.vercel.app
- Backend: https://your-api.onrender.com
- Database: (managed by hosting provider)

## Environment Variables Reference

### Backend
```
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://your-app.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend
```
VITE_API_URL=https://your-api.onrender.com/api
```

## Rollback Plan

If deployment fails:

1. Check logs for errors
2. Verify environment variables
3. Test database connection
4. Roll back to previous version
5. Debug in development environment

## Support Contacts

- Technical Lead: [email]
- DevOps: [email]
- Database Admin: [email]

## Notes

- First deployment may take 5-10 minutes
- Allow webcam permissions in production
- Test on multiple browsers
- Monitor error rates post-deployment
- Keep backup of database before major updates
