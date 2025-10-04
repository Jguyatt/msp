# 🚀 Deployment Guide

## Frontend Deployment (Vercel)

### 1. Prepare Frontend
```bash
# Build the frontend
npm run build

# Test the build locally
npx serve -s build
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Set environment variables in Vercel dashboard:
   - `REACT_APP_CLERK_PUBLISHABLE_KEY`
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `REACT_APP_OPENAI_API_KEY`
   - `REACT_APP_API_URL` (will be set after backend deployment)

### 3. Update API URL
After backend deployment, update `REACT_APP_API_URL` in Vercel with your backend URL.

## Backend Deployment (Railway)

### 1. Prepare Backend
```bash
# Test backend locally
PORT=3002 node server-supabase.js
```

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub
3. Select your repository
4. Railway will auto-detect Node.js and deploy
5. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `PORT` (Railway will set this automatically)

### 3. Get Backend URL
Railway will provide a URL like: `https://your-app.railway.app`

## Stripe Webhook Setup

### 1. Configure Webhook
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-backend-url.railway.app/webhook/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret and add to Railway environment variables

### 2. Test Webhook
```bash
# Test webhook endpoint
curl https://your-backend-url.railway.app/api/health
```

## Final Steps

### 1. Update Frontend API URL
In Vercel dashboard, update:
- `REACT_APP_API_URL=https://your-backend-url.railway.app/api`

### 2. Test Complete Flow
1. Frontend loads from Vercel
2. Backend API calls work
3. Stripe webhooks work
4. Database updates work

## Environment Variables Summary

### Frontend (Vercel)
- `REACT_APP_CLERK_PUBLISHABLE_KEY`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_OPENAI_API_KEY`
- `REACT_APP_API_URL`

### Backend (Railway)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PORT`

## Troubleshooting

### Common Issues
1. **CORS errors**: Check API URL configuration
2. **Webhook failures**: Verify webhook secret and URL
3. **Database errors**: Check Supabase credentials
4. **Build failures**: Check Node.js version compatibility

### Health Checks
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.railway.app/api/health`
- Webhook: Test from Stripe dashboard
