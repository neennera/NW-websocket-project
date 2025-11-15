# 🚀 Deployment Checklist

## ✅ Pre-Deployment

- [ ] All code committed and tested locally
- [ ] `.gitignore` file created (excludes `.env`, `node_modules`)
- [ ] `.env.example` files updated with all required variables
- [ ] CORS configured to support production domain
- [ ] WebSocket URL uses environment variable
- [ ] API URLs use environment variable

## ✅ Database Setup (Neon.tech)

- [ ] Account created at https://neon.tech
- [ ] New project created
- [ ] DATABASE_URL copied and saved securely
- [ ] Database URL format: `postgresql://user:pass@host/db?sslmode=require`

## ✅ GitHub Setup

- [ ] GitHub repository created
- [ ] Local git initialized: `git init`
- [ ] Code pushed to GitHub: `git push origin main`
- [ ] Repository is public or connected to deployment platforms

## ✅ Backend Deployment (Render.com)

- [ ] Account created at https://render.com
- [ ] New Web Service created
- [ ] GitHub repository connected
- [ ] Configuration set:
  - [ ] Name: `websocket-chat-api`
  - [ ] Root Directory: `apps/api`
  - [ ] Build Command: `npm install && npm run build`
  - [ ] Start Command: `npm start`
  - [ ] Instance Type: Free
- [ ] Environment variables added:
  - [ ] `DATABASE_URL` (from Neon)
  - [ ] `JWT_SECRET` (generate random string)
  - [ ] `NODE_ENV=production`
  - [ ] `ALLOWED_ORIGINS` (add localhost + Vercel URL later)
- [ ] Service deployed successfully
- [ ] Backend URL copied: `https://_____.onrender.com`
- [ ] Health check passed (visit URL in browser)

## ✅ Frontend Deployment (Vercel)

- [ ] Account created at https://vercel.com
- [ ] New Project created
- [ ] GitHub repository imported
- [ ] Configuration set:
  - [ ] Framework: Next.js
  - [ ] Root Directory: `apps/web`
  - [ ] Build Command: `npm run build`
  - [ ] Install Command: `npm install`
- [ ] Environment variables added:
  - [ ] `NEXT_PUBLIC_API_URL=https://_____.onrender.com/api`
  - [ ] `NEXT_PUBLIC_WS_URL=wss://_____.onrender.com/ws`
- [ ] Project deployed successfully
- [ ] Frontend URL copied: `https://_____.vercel.app`

## ✅ CORS Configuration

- [ ] Vercel URL added to `ALLOWED_ORIGINS` in Render
- [ ] Backend redeployed after CORS update
- [ ] Format: `http://localhost:3000,https://_____.vercel.app`

## ✅ Database Migrations

- [ ] Opened Render Shell (or used local connection)
- [ ] Run: `npx prisma migrate deploy`
- [ ] Run: `npx prisma db seed`
- [ ] Verify: Check Neon dashboard for tables and data

## ✅ Testing

- [ ] **Backend API Test**:

  - [ ] Visit `https://_____.onrender.com/` (should respond)
  - [ ] Test login endpoint with curl/Postman
  - [ ] Check Render logs for errors

- [ ] **Frontend Test**:

  - [ ] Visit `https://_____.vercel.app`
  - [ ] Register new account
  - [ ] Login successfully
  - [ ] View groups list

- [ ] **WebSocket Test**:

  - [ ] Join a group chat
  - [ ] Send messages
  - [ ] Open in another browser/incognito
  - [ ] Verify real-time message sync
  - [ ] Test forbidden words sync

- [ ] **Cross-Browser Test**:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari (if available)
  - [ ] Mobile browser

## ✅ Final Checks

- [ ] All environment variables verified
- [ ] CORS working (no console errors)
- [ ] WebSocket connected (check browser console)
- [ ] Database queries working
- [ ] JWT authentication working
- [ ] Real-time features working
- [ ] Forbidden words syncing
- [ ] No errors in Render logs
- [ ] No errors in Vercel logs
- [ ] No errors in browser console

## 📝 Important URLs

Record your deployment URLs:

```
Backend API: https://_____________________.onrender.com
Frontend:    https://_____________________.vercel.app
Database:    (Neon dashboard URL)
GitHub:      https://github.com/_______/_______
```

## 🐛 Common Issues

**If deployment fails:**

1. Check build logs in Render/Vercel
2. Verify all environment variables are set
3. Check DATABASE_URL format
4. Ensure `package.json` scripts are correct

**If WebSocket won't connect:**

1. Use `wss://` not `ws://` in production
2. Check Render logs for WebSocket errors
3. Verify `NEXT_PUBLIC_WS_URL` is correct

**If CORS errors appear:**

1. Add Vercel URL to `ALLOWED_ORIGINS`
2. Redeploy backend
3. Clear browser cache

**If database errors:**

1. Run migrations in Render Shell
2. Check DATABASE_URL is correct
3. Verify Neon database is active

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ You can register and login
- ✅ You can create/join groups
- ✅ Messages sync in real-time
- ✅ Multiple users can chat together
- ✅ Forbidden words sync instantly
- ✅ No console errors
- ✅ Works in multiple browsers

## 📊 Post-Deployment

- [ ] Share app URL with friends/team
- [ ] Set up monitoring (optional)
- [ ] Configure custom domain (optional)
- [ ] Document any custom features
- [ ] Create backup of environment variables

## 🔄 Future Updates

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Both Render and Vercel will auto-deploy! ✨

---

**Deployment Date**: ****\_\_\_****
**Deployed By**: ****\_\_\_****
**Version**: ****\_\_\_****
