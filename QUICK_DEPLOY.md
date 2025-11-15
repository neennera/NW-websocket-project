project name : network-candy-chat

# Quick Deployment Commands

## Prerequisites

```bash
# Make sure you have git initialized
cd d:\.university\Network\NW-project
git init
git add .
git commit -m "Initial commit"
```

## Step 1: Database (Neon.tech)

1. Go to https://neon.tech
2. Sign up → Create project
3. Copy DATABASE_URL (looks like: `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb`)

## Step 2: Push to GitHub

```bash
# Create repo at https://github.com/new
git remote add origin https://github.com/YOUR_USERNAME/NW-websocket-project.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy Backend (Render.com)

1. **Go to**: https://render.com → Sign up with GitHub
2. **Click**: "New +" → "Web Service"
3. **Select**: Your GitHub repo
4. **Configure**:
   - Name: `network-candy-chat`
   - Root Directory: `apps/api`
   - Build Command: `pnpm install && pnpm run build`
   - Start Command: `pnpm start`
5. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://... (from Neon)
   JWT_SECRET=your-secret-key-change-this
   NODE_ENV=production
   ```
6. **Deploy** → Wait 5-10 minutes
7. **Copy URL**: `https://network-candy-chat.onrender.com`

## Step 4: Deploy Frontend (Vercel)

1. **Go to**: https://vercel.com → Sign up with GitHub
2. **Click**: "Add New..." → "Project"
3. **Import**: Your GitHub repo
4. **Configure**:
   - Framework: Next.js
   - Root Directory: `apps/web`
5. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://network-candy-chat.onrender.com/api
   NEXT_PUBLIC_WS_URL=wss://network-candy-chat.onrender.com/ws
   ```
   ⚠️ Use `wss://` (secure WebSocket)!
6. **Deploy** → Wait 2-3 minutes
7. **Copy URL**: `https://your-app.vercel.app`

## Step 5: Update CORS

1. Go to Render dashboard → Your service
2. Add environment variable:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
   ```
3. Click "Manual Deploy" → "Deploy latest commit"

## Step 6: Run Migrations

In Render dashboard → Shell tab:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## Step 7: Test

Visit your Vercel URL → Register → Login → Chat!

---

## 🔄 To Update Later

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Both platforms auto-deploy!
```

---

## 🐛 Quick Troubleshooting

**WebSocket won't connect?**

- Use `wss://` not `ws://`
- Check Render logs for errors

**CORS error?**

- Add Vercel URL to ALLOWED_ORIGINS
- Redeploy backend

**Database error?**

- Check DATABASE_URL is correct
- Run migrations in Render shell

**First load slow?**

- Free tier sleeps after 15 min
- First request takes 30-60 seconds

---

## 📊 Where to Check

- **Backend Logs**: Render dashboard → Logs tab
- **Frontend Logs**: Vercel dashboard → Deployments → Function Logs
- **Database**: Neon dashboard → Tables
