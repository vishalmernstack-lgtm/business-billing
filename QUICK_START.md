# Quick Start Guide

## 🚀 Push to GitHub (Quick Commands)

```bash
# 1. Initialize Git
git init

# 2. Add all files
git add .

# 3. First commit
git commit -m "Initial commit: Business Billing Software"

# 4. Add remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 5. Push to GitHub
git branch -M main
git push -u origin main
```

## 📦 Installation (Quick)

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 🔑 Default Login

After running seed script:
```bash
cd backend
node src/seedUsers.js
```

- **Email**: admin@example.com
- **Password**: admin123

## 📝 Important Files Created

- ✅ `.gitignore` - Excludes sensitive files
- ✅ `README.md` - Project documentation
- ✅ `.env.example` - Environment template
- ✅ `GITHUB_SETUP.md` - Detailed GitHub guide
- ✅ `.gitkeep` files - Preserves empty directories

## ⚠️ Before Pushing

1. ✅ Check `.env` is in `.gitignore`
2. ✅ Remove any sensitive data
3. ✅ Test the application works
4. ✅ Update README with your info

## 🌐 Access URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API: http://localhost:5000/api

## 📞 Need Help?

See `GITHUB_SETUP.md` for detailed instructions!
