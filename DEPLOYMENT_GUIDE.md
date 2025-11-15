# 🚀 Deployment Guide - WebSocket Chat Application

## Overview

This guide will help you deploy your WebSocket chat application to **free platforms**:

- **Backend (API + WebSocket)**: Render.com (Free tier)
- **Frontend (Next.js)**: Vercel (Free tier)
- **Database**: Neon.tech or Supabase (Free PostgreSQL)

---

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ GitHub account
- ✅ Git installed locally
- ✅ Your project code ready
- ✅ All local changes committed

---

## 🗂️ Step 1: Prepare Your Project

### 1.1 Create `.gitignore` (if not exists)

Create a `.gitignore` file in the root directory:

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env*.local
apps/api/.env
apps/web/.env.local

# Build outputs
.next/
out/
dist/
build/

# Database
apps/api/prisma/dev.db
apps/api/prisma/migrations/migration_lock.toml

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

### 1.2 Update API Package.json

Add build script to `apps/api/package.json`:

```json
{
  "scripts": {
    "dev": "node index.js",
    "start": "node index.js",
    "build": "npx prisma generate && npx prisma migrate deploy",
    "prisma:generate": "prisma generate",
    "seed": "prisma db seed"
  }
}
```

### 1.3 Add Port Configuration

Ensure `apps/api/index.js` uses environment PORT:

```javascript
const PORT = process.env.PORT || 3001;
```

---

## 🗄️ Step 2: Set Up Database (Neon.tech)

### 2.1 Create Neon Account

1. Go to https://neon.tech
2. Sign up with GitHub (free)
3. Create a new project:
   - **Project name**: `websocket-chat-db`
   - **Region**: Choose closest to you
   - **Postgres version**: 16 (latest)

### 2.2 Get Connection String

1. After creation, click **"Connection Details"**
2. Copy the **DATABASE_URL** (looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. **Save this** - you'll need it for backend deployment

### Alternative: Supabase

1. Go to https://supabase.com
2. Create new project
3. Go to **Settings → Database → Connection String**
4. Copy the **URI** format connection string

---

## 🔧 Step 3: Push to GitHub

### 3.1 Initialize Git (if not done)

```bash
cd d:\.university\Network\NW-project
git init
git add .
git commit -m "Initial commit - WebSocket Chat App"
```

### 3.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create repository: `NW-websocket-project`
3. **Don't** initialize with README

### 3.3 Push Code

```bash
git remote add origin https://github.com/YOUR_USERNAME/NW-websocket-project.git
git branch -M main
git push -u origin main
```

---

## 🖥️ Step 4: Deploy Backend to Render

### 4.1 Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (free)
3. Click **"New +"** → **"Web Service"**

### 4.2 Connect GitHub Repository

1. Connect your GitHub account
2. Select `NW-websocket-project` repository
3. Click **"Connect"**

### 4.3 Configure Web Service

Fill in the following settings:

| Field              | Value                          |
| ------------------ | ------------------------------ |
| **Name**           | `websocket-chat-api`           |
| **Region**         | Choose closest region          |
| **Branch**         | `main`                         |
| **Root Directory** | `apps/api`                     |
| **Runtime**        | `Node`                         |
| **Build Command**  | `npm install && npm run build` |
| **Start Command**  | `npm start`                    |
| **Instance Type**  | `Free`                         |

### 4.4 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

| Key            | Value                                            |
| -------------- | ------------------------------------------------ |
| `DATABASE_URL` | `postgresql://username:password@...` (from Neon) |
| `PORT`         | `3001` (or leave empty for auto-assign)          |
| `JWT_SECRET`   | `your-super-secret-key-here-change-this`         |
| `NODE_ENV`     | `production`                                     |

### 4.5 Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Copy your backend URL: `https://websocket-chat-api.onrender.com`

⚠️ **Note**: Free tier goes to sleep after 15 minutes of inactivity. First request may take 30-60 seconds.

---

## 🌐 Step 5: Deploy Frontend to Vercel

### 5.1 Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub (free)
3. Click **"Add New..."** → **"Project"**

### 5.2 Import GitHub Repository

1. Select `NW-websocket-project`
2. Click **"Import"**

### 5.3 Configure Project

| Field                | Value           |
| -------------------- | --------------- |
| **Framework Preset** | `Next.js`       |
| **Root Directory**   | `apps/web`      |
| **Build Command**    | `npm run build` |
| **Output Directory** | `.next`         |
| **Install Command**  | `npm install`   |

### 5.4 Add Environment Variables

Click **"Environment Variables"**:

| Key                   | Value                                         |
| --------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `https://websocket-chat-api.onrender.com/api` |
| `NEXT_PUBLIC_WS_URL`  | `wss://websocket-chat-api.onrender.com/ws`    |

⚠️ **Important**: Use `wss://` (secure WebSocket) for production!

### 5.5 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your app will be live at: `https://your-app.vercel.app`

---

## 🔧 Step 6: Update Frontend Code for Production

### 6.1 Update API URLs

The frontend should use environment variables. Check these files:

**`apps/web/lib/useWebSocket.js`**:

```javascript
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
```

**All API fetch calls in `apps/web/pages/**/\*.js`\*\*:

Replace hardcoded URLs like:

```javascript
// ❌ Bad
fetch(`http://localhost:3001/api/groups/${roomId}`);

// ✅ Good
fetch(
  `${
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  }/groups/${roomId}`
);
```

### 6.2 Create Environment Variable Helper

Create `apps/web/lib/api.js`:

```javascript
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

export function apiUrl(path) {
  return `${API_URL}${path}`;
}
```

Then update fetch calls:

```javascript
import { apiUrl } from '../../lib/api';

fetch(apiUrl(`/groups/${roomId}`), {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## 🔄 Step 7: Update CORS for Production

### 7.1 Update Backend CORS

Edit `apps/api/index.js`:

```javascript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://your-app.vercel.app', // Add your Vercel URL
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});
```

Or use environment variable:

```javascript
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];
```

Then in Render, add environment variable:

- `ALLOWED_ORIGINS` = `http://localhost:3000,https://your-app.vercel.app`

---

## 🗄️ Step 8: Run Database Migrations

### 8.1 From Render Dashboard

1. Go to your Render service
2. Click **"Shell"** tab
3. Run:

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 8.2 Or Locally with Production DB

```bash
cd apps/api
# Set production DATABASE_URL temporarily
$env:DATABASE_URL="postgresql://user:pass@neon.tech/db"
npx prisma migrate deploy
npx prisma db seed
```

---

## ✅ Step 9: Test Your Deployment

### 9.1 Test Backend API

```bash
curl https://websocket-chat-api.onrender.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"a@example.com","password":"password123"}'
```

Should return JWT token.

### 9.2 Test Frontend

1. Visit `https://your-app.vercel.app`
2. Register new account
3. Create/join group
4. Send messages
5. Open in another browser - test real-time sync

---

## 🐛 Troubleshooting

### Backend Issues

**"Cannot connect to database"**

- Check DATABASE_URL in Render environment variables
- Ensure Neon database is active (not paused)
- Check if IP is whitelisted (Neon usually allows all)

**"WebSocket connection failed"**

- Ensure you're using `wss://` (not `ws://`) in production
- Check Render logs for errors
- Verify WebSocket path `/ws` is correct

**"Service unavailable"**

- Free tier sleeps after 15 min inactivity
- First request takes 30-60 seconds to wake up
- Consider upgrading to paid tier for always-on

### Frontend Issues

**"Network Error" or CORS**

- Check ALLOWED_ORIGINS in backend
- Ensure Vercel URL is added to CORS whitelist
- Redeploy backend after CORS changes

**"Cannot read environment variables"**

- Ensure variables start with `NEXT_PUBLIC_`
- Redeploy frontend after adding variables
- Check Vercel dashboard → Settings → Environment Variables

**WebSocket not connecting**

- Check browser console for errors
- Verify `NEXT_PUBLIC_WS_URL` is set correctly
- Test WebSocket endpoint directly: https://www.websocket.org/echo.html

---

## 📊 Monitoring & Logs

### Render Logs

1. Go to Render dashboard
2. Click your service
3. Click **"Logs"** tab
4. Real-time logs appear here

### Vercel Logs

1. Go to Vercel dashboard
2. Click your project
3. Click **"Deployments"**
4. Click on latest deployment → **"View Function Logs"**

---

## 💰 Free Tier Limits

### Render.com (Backend)

- ✅ 750 hours/month (enough for 1 service)
- ✅ 512 MB RAM
- ✅ Shared CPU
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ 100 GB bandwidth/month

### Vercel (Frontend)

- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ 100 GB hours (serverless functions)
- ✅ Custom domains

### Neon.tech (Database)

- ✅ 0.5 GB storage
- ✅ 1 project
- ✅ Unlimited queries
- ⚠️ Pauses after 5 min inactivity (wakes automatically)

---

## 🔄 Continuous Deployment

Both Vercel and Render auto-deploy when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push origin main

# Both platforms auto-deploy!
```

---

## 🎯 Quick Checklist

- [ ] Database created on Neon/Supabase
- [ ] Code pushed to GitHub
- [ ] Backend deployed to Render
- [ ] Environment variables set on Render
- [ ] Database migrations run
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set on Vercel
- [ ] CORS updated with Vercel URL
- [ ] Tested login/register
- [ ] Tested WebSocket connection
- [ ] Tested real-time messaging

---

## 📚 Additional Resources

- **Render Documentation**: https://render.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **Neon Documentation**: https://neon.tech/docs
- **Prisma Deployment**: https://www.prisma.io/docs/guides/deployment

---

## 🚀 Alternative Platforms

### Backend Alternatives:

1. **Railway.app** - Similar to Render, $5/month credit
2. **Fly.io** - Free tier with 3 small VMs
3. **Cyclic.sh** - Free for small apps
4. **Heroku** - No longer has free tier

### Database Alternatives:

1. **Supabase** - Free PostgreSQL with auth
2. **PlanetScale** - Free MySQL (serverless)
3. **MongoDB Atlas** - Free 512MB cluster
4. **ElephantSQL** - Free 20MB PostgreSQL

### Frontend Alternatives:

1. **Netlify** - Similar to Vercel
2. **Cloudflare Pages** - Free unlimited
3. **GitHub Pages** - Static sites only

---

## 🎉 Success!

Your WebSocket chat application is now deployed and accessible worldwide!

**Share your app**: `https://your-app.vercel.app`

Need help? Check the troubleshooting section or create an issue on GitHub.
