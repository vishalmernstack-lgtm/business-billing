# ⚡ Quick Deploy Reference

## 🎯 3-Step Deployment (15 minutes)

### Step 1: MongoDB Atlas (5 min)
1. Sign up: https://www.mongodb.com/cloud/atlas/register
2. Create FREE cluster (M0)
3. Create user + whitelist 0.0.0.0/0
4. Copy connection string

### Step 2: Render.com Backend (5 min)
1. Sign up: https://render.com (use GitHub)
2. New Web Service → Connect `business-billing` repo
3. Settings:
   - Root: `backend`
   - Build: `npm install`
   - Start: `npm start`
   - Instance: **Free**
4. Add environment variables:
   ```
   MONGODB_URI=your-connection-string
   JWT_SECRET=random-secret-key
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://your-app.vercel.app
   ```
5. Deploy → Copy backend URL

### Step 3: Vercel Frontend (3 min)
1. Sign up: https://vercel.com (use GitHub)
2. Import `business-billing` repo
3. Settings:
   - Root: `frontend`
   - Framework: Vite
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
5. Deploy → Copy frontend URL

### Step 4: Update Backend (2 min)
1. Go to Render → billing-backend → Environment
2. Update `FRONTEND_URL` with your Vercel URL
3. Save (auto-redeploys)

## ✅ Done!

**Your app is live at:** `https://your-app.vercel.app`

---

## 🔗 Quick Links

- **MongoDB Atlas**: https://cloud.mongodb.com
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your GitHub**: https://github.com/vishalmernstack-lgtm/business-billing

---

## 🆘 Quick Fixes

**CORS Error?**
- Check FRONTEND_URL in Render matches Vercel URL
- Check VITE_API_URL in Vercel matches Render URL

**Database Error?**
- Check MONGODB_URI in Render
- Verify IP whitelist: 0.0.0.0/0

**Build Failed?**
- Check root directory is set correctly
- View logs for specific error

---

## 💰 Cost: $0/month (Forever Free!)

- Vercel: Free tier
- Render: 750 hours/month free
- MongoDB: 512MB free forever
