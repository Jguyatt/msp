# Vercel Deployment Guide

This guide will help you deploy your MSP application to Vercel and fix the contract creation issue.

## 🚀 Quick Fix for Contract Creation Error

The "Failed to create contract" error occurs because your Vercel deployment is trying to make direct Supabase calls from the frontend, which don't have the proper permissions.

## 📋 Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com
2. **GitHub Repository** - Your code should be in a GitHub repo
3. **Supabase Project** - Your database should be set up
4. **Clerk Account** - For authentication

## 🛠️ Setup Steps

### 1. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a React app

### 2. Configure Environment Variables

In your Vercel dashboard, go to:
**Settings → Environment Variables**

Add these variables:

```
SUPABASE_URL=https://skyexizhdrrqunmllkza.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

**Important**: Use the `SERVICE_ROLE_KEY`, not the anon key!

### 3. Get Your Supabase Service Role Key

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → API**
4. Copy the `service_role` key (not the `anon` key)

### 4. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-project.vercel.app`

## 🔧 What Was Fixed

### Before (Broken)
- Frontend made direct Supabase calls
- No server-side API routes
- Permission issues with anon key

### After (Fixed)
- Created `/api/contracts.js` API route
- Frontend calls API routes instead of direct Supabase
- Uses service role key for proper permissions
- Added proper error handling

## 🧪 Testing

1. Go to your Vercel deployment URL
2. Log in with Clerk
3. Try creating a contract
4. It should work without the "Failed to create contract" error

## 📁 Files Added/Modified

- `api/contracts.js` - New API route for contract operations
- `vercel.json` - Vercel configuration
- `src/services/supabaseService.js` - Updated to use API routes
- `vercel-env-template.txt` - Environment variables template

## 🚨 Troubleshooting

### Still getting errors?

1. **Check Environment Variables**: Make sure all are set in Vercel
2. **Check Supabase Key**: Use service_role key, not anon key
3. **Check Logs**: Go to Vercel dashboard → Functions → View logs
4. **Redeploy**: After changing env vars, redeploy the app

### Common Issues

- **"User not found"**: Make sure user exists in Supabase users table
- **"Database error"**: Check Supabase service role key
- **CORS errors**: API routes include CORS headers

## 📊 Monitoring

- **Vercel Dashboard**: Monitor deployments and function logs
- **Supabase Dashboard**: Check database operations
- **Browser DevTools**: Check network requests for API calls

## 🔄 Next Steps

After fixing contract creation, you may want to:
1. Add more API routes for other operations
2. Implement proper error boundaries
3. Add loading states
4. Set up monitoring and alerts
