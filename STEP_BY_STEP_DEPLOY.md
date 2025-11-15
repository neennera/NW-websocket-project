# 🎯 Step-by-Step Deployment Guide

Follow these steps in order to deploy your WebSocket chat application to free platforms.

---

## 📦 What You'll Deploy

- **Frontend**: Next.js app → **Vercel** (Free)
- **Backend**: Node.js + Express + WebSocket → **Render** (Free)
- **Database**: PostgreSQL → **Neon.tech** (Free)

**Total Cost**: $0/month 🎉

---

## ⏱️ Time Required

- **Database Setup**: 5 minutes
- **Backend Deploy**: 10-15 minutes
- **Frontend Deploy**: 5-10 minutes
- **Testing**: 5-10 minutes
- **Total**: ~30-40 minutes

---

## 🚀 Step 1: Database (Neon.tech)

### 1.1 Create Account

1. Visit: https://neon.tech
2. Click **"Sign up"** → Use GitHub
3. Authorize Neon

### 1.2 Create Database

1. Click **"Create a project"**
2. Fill in:
   - **Name**: `websocket-chat-db`
   - **Region**: Select closest to you
   - **Postgres version**: 16 (default)
3. Click **"Create project"**

### 1.3 Get Connection String

1. After creation, you'll see **"Connection Details"**
2. Click **"Connection string"** tab
3. Copy the **connection string** (looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **SAVE THIS** in a safe place (you'll need it soon)

✅ **Done!** Your database is ready.

---

## 📂 Step 2: Prepare Code for GitHub

### 2.1 Check Git Status

Open terminal in your project folder:

```powershell
cd d:\.university\Network\NW-project
git status
```

If you see "fatal: not a git repository":

```powershell
git init
```

### 2.2 Commit Your Code

```powershell
# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"
```

### 2.3 Create GitHub Repository

1. Go to: https://github.com/new
2. Fill in:
   - **Repository name**: `websocket-chat-app` (or any name)
   - **Description**: WebSocket real-time chat application
   - **Visibility**: Public (required for free deployments)
3. **DO NOT** initialize with README, .gitignore, or license
4. Click **"Create repository"**

### 2.4 Push to GitHub

Copy the commands from GitHub page (they look like this):

```powershell
git remote add origin https://github.com/YOUR_USERNAME/websocket-chat-app.git
git branch -M main
git push -u origin main
```

✅ **Done!** Your code is on GitHub.

---

## 🖥️ Step 3: Deploy Backend (Render.com)

### 3.1 Create Render Account

1. Visit: https://render.com
2. Click **"Get Started"**
3. Sign up with **GitHub**
4. Authorize Render

### 3.2 Create New Web Service

1. Click **"New +"** (top right)
2. Select **"Web Service"**
3. You'll see "Create a new Web Service"

### 3.3 Connect Repository

1. If first time: Click **"Connect account"** → Authorize Render to access GitHub
2. Find your repository: `websocket-chat-app`
3. Click **"Connect"**

### 3.4 Configure Service

Fill in these exact settings:

| Field              | Value                                       |
| ------------------ | ------------------------------------------- |
| **Name**           | `websocket-chat-api` (or any name you like) |
| **Region**         | Oregon (or closest to you)                  |
| **Branch**         | `main`                                      |
| **Root Directory** | `apps/api`                                  |
| **Runtime**        | Node                                        |
| **Build Command**  | `npm install && npm run build`              |
| **Start Command**  | `npm start`                                 |

### 3.5 Select Plan

- Scroll down to **"Instance Type"**
- Select **"Free"** ($0/month)

### 3.6 Add Environment Variables

Click **"Advanced"** button, then **"Add Environment Variable"**:

Add these 4 variables:

**Variable 1:**

- Key: `DATABASE_URL`
- Value: (Paste the connection string from Neon.tech)

**Variable 2:**

- Key: `JWT_SECRET`
- Value: `my-super-secret-jwt-key-change-this-in-production`
  (or generate random: visit https://www.uuidgenerator.net/)

**Variable 3:**

- Key: `NODE_ENV`
- Value: `production`

**Variable 4:**

- Key: `ALLOWED_ORIGINS`
- Value: `http://localhost:3000`
  (We'll add Vercel URL later)

### 3.7 Deploy!

1. Click **"Create Web Service"**
2. Wait 5-10 minutes (Render is building your app)
3. You'll see logs scrolling
4. Wait for: **"🎉 Your service is live"**

### 3.8 Save Your Backend URL

At the top of the page, you'll see:

```
https://websocket-chat-api.onrender.com
```

**COPY THIS URL** - you'll need it for frontend!

### 3.9 Test Backend

Visit your URL in browser: `https://websocket-chat-api.onrender.com`

You should see a page (might be blank, that's OK).

✅ **Done!** Your backend is deployed.

---

## 🌐 Step 4: Deploy Frontend (Vercel)

### 4.1 Create Vercel Account

1. Visit: https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

### 4.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. You'll see your GitHub repositories
3. Find `websocket-chat-app`
4. Click **"Import"**

### 4.3 Configure Project

Vercel auto-detects Next.js. Update these settings:

**Framework Preset**: Next.js (should be auto-selected)

**Root Directory**:

- Click **"Edit"**
- Type: `apps/web`
- Click **"Continue"**

### 4.4 Add Environment Variables

Click **"Environment Variables"** section:

**Variable 1:**

- Name: `NEXT_PUBLIC_API_URL`
- Value: `https://websocket-chat-api.onrender.com/api`
  (Replace with YOUR backend URL from Step 3.8 + `/api`)

**Variable 2:**

- Name: `NEXT_PUBLIC_WS_URL`
- Value: `wss://websocket-chat-api.onrender.com/ws`
  (Replace with YOUR backend URL + `/ws`, use `wss://` not `ws://`)

⚠️ **Important**:

- Use `https://` for API URL
- Use `wss://` (secure WebSocket) for WS URL

### 4.5 Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll see confetti 🎉 when done!

### 4.6 Save Your Frontend URL

You'll see:

```
https://websocket-chat-app-xxxxx.vercel.app
```

**COPY THIS URL** - you need to update backend CORS!

✅ **Done!** Your frontend is deployed.

---

## 🔧 Step 5: Update CORS

Now we need to tell backend to accept requests from your frontend.

### 5.1 Go Back to Render

1. Visit: https://dashboard.render.com
2. Click your service: `websocket-chat-api`
3. Click **"Environment"** in left sidebar

### 5.2 Update ALLOWED_ORIGINS

1. Find the `ALLOWED_ORIGINS` variable
2. Click the **edit icon** (pencil)
3. Change value to:
   ```
   http://localhost:3000,https://your-frontend-url.vercel.app
   ```
   (Replace with YOUR actual Vercel URL, keep both URLs separated by comma)
4. Click **"Save Changes"**

### 5.3 Redeploy Backend

1. Click **"Manual Deploy"** (top right)
2. Select **"Deploy latest commit"**
3. Wait ~2 minutes

✅ **Done!** CORS is configured.

---

## 🗄️ Step 6: Set Up Database Tables

### 6.1 Open Render Shell

1. In Render dashboard, click your service
2. Click **"Shell"** tab (top menu)
3. Wait for shell to load (black terminal window)

### 6.2 Run Migrations

Type these commands one by one:

```bash
npx prisma migrate deploy
```

Wait for ✓ (about 30 seconds)

Then:

```bash
npx prisma db seed
```

Wait for ✓ (creates test users A and B)

### 6.3 Verify

Go to Neon dashboard → Your project → Tables

You should see:

- User
- Group
- GroupMember
- Message
- ForbiddenWord
- Nickname
- Tag

✅ **Done!** Database has tables and seed data.

---

## ✅ Step 7: Test Everything

### 7.1 Open Your App

Visit your Vercel URL: `https://your-app.vercel.app`

### 7.2 Test Registration

1. Click **"Register"**
2. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
3. Click **"Register"**
4. Should redirect to login

### 7.3 Test Login

1. Login with credentials from Step 7.2
2. Should see home page with groups

### 7.4 Test Chat

1. Click **"ABgroup"** (created by seed)
2. Should see chat interface
3. Type a message → Send
4. Message should appear

### 7.5 Test Real-Time (Most Important!)

1. **Open another browser** (or incognito mode)
2. Login as different user:
   - Email: `a@example.com`
   - Password: `password123`
3. Join same group: **"ABgroup"**
4. **In first browser**: Send a message
5. **In second browser**: Message should appear instantly!

### 7.6 Test Forbidden Words

1. Click ⚙️ (settings icon)
2. Click **"🚫 Forbidden Words"**
3. Add word: `test`
4. In other browser: Try typing `test` → Should be blocked
5. Word should appear in both browsers instantly!

✅ **All tests passed?** You're done! 🎉

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"

**Check:**

1. Backend URL in Vercel environment variables is correct
2. URL includes `/api` for API calls
3. Backend service is running (check Render dashboard)

**Fix:**

- Go to Vercel → Project → Settings → Environment Variables
- Update `NEXT_PUBLIC_API_URL`
- Redeploy frontend

### Issue: "WebSocket connection failed"

**Check:**

1. Using `wss://` (not `ws://`)
2. Backend URL is correct
3. Backend service is running

**Fix:**

- Go to Vercel → Settings → Environment Variables
- Update `NEXT_PUBLIC_WS_URL` to use `wss://`
- Redeploy frontend

### Issue: "CORS error" in console

**Check:**

1. `ALLOWED_ORIGINS` includes your Vercel URL
2. No typos in URL
3. Backend was redeployed after adding URL

**Fix:**

- Go to Render → Environment → `ALLOWED_ORIGINS`
- Add your Vercel URL (format: `https://your-app.vercel.app`)
- Redeploy backend

### Issue: "First load is very slow"

**This is normal!**

- Free tier sleeps after 15 minutes
- First request takes 30-60 seconds to wake up
- Subsequent requests are fast

### Issue: "Database error"

**Check:**

1. Migrations were run in Render Shell
2. DATABASE_URL is correct
3. Neon database is active

**Fix:**

- Run migrations again in Render Shell
- Check Neon dashboard for database status

---

## 📊 Monitor Your App

### View Backend Logs

1. Render dashboard → Your service
2. Click **"Logs"** tab
3. See real-time logs

### View Frontend Logs

1. Vercel dashboard → Your project
2. Click **"Deployments"**
3. Click latest deployment → **"View Function Logs"**

### View Database

1. Neon dashboard
2. Click your project
3. Click **"Tables"** → Browse data

---

## 🎉 Success!

Your app is now live at:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://websocket-chat-api.onrender.com`

Share the frontend URL with friends to test together!

---

## 🔄 Deploy Updates Later

Made changes? Deploy them:

```powershell
cd d:\.university\Network\NW-project
git add .
git commit -m "Add new feature"
git push origin main
```

Both Render and Vercel will **auto-deploy** your changes! ✨

---

## ⚠️ Important Notes

### Free Tier Limitations

**Render (Backend):**

- Sleeps after 15 minutes of no activity
- First request after sleep takes 30-60 seconds
- 750 hours/month (enough for 1 service)

**Vercel (Frontend):**

- Always on, no sleeping
- 100 GB bandwidth/month
- Unlimited requests

**Neon (Database):**

- 0.5 GB storage
- Pauses after 5 minutes (auto-wakes instantly)
- Unlimited queries

### Security Reminders

- Change `JWT_SECRET` to a random string
- Never commit `.env` files to GitHub
- Use strong passwords in production
- Keep dependencies updated

---

## 🆘 Need Help?

If you get stuck:

1. Check **Troubleshooting** section above
2. Check Render/Vercel logs for errors
3. Open browser DevTools → Console for frontend errors
4. Search error messages online

---

## 📚 What's Next?

Optional improvements:

- Add custom domain (free on Vercel)
- Set up monitoring/alerts
- Add more features
- Upgrade to paid tier for better performance
- Add analytics

---

**🎊 Congratulations!** You've successfully deployed a full-stack WebSocket application to production!
