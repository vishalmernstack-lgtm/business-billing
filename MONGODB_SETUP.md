# MongoDB Setup Guide for Windows

## Option 1: Quick Fix - Use MongoDB Atlas (Recommended)

### Step 1: Fix IP Whitelist Issue
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Login to your account
3. Go to your cluster → Network Access
4. Click "Add IP Address"
5. Click "Add Current IP Address" or add `0.0.0.0/0` for all IPs (less secure but works)
6. Save the changes

### Step 2: Update Connection String
Your current connection string should work after IP whitelisting:
```
MONGODB_URI=mongodb+srv://vishalcode10_db_user:ULOXS6GmA2kWKIw3@cashcollection.hma5gvz.mongodb.net/business-billing?retryWrites=true&w=majority
```

## Option 2: Install MongoDB Locally

### Method 1: Download from MongoDB Website
1. Go to https://www.mongodb.com/try/download/community
2. Select Windows, Version 7.0, MSI package
3. Download and run the installer
4. Choose "Complete" installation
5. Install as Windows Service (recommended)
6. Install MongoDB Compass (optional GUI)

### Method 2: Using PowerShell (if you have package manager)
```powershell
# If you have Scoop package manager
scoop install mongodb

# If you have Chocolatey package manager
choco install mongodb
```

### Step 3: Start MongoDB Service
```cmd
# Start MongoDB service
net start MongoDB

# Or if installed manually
mongod --dbpath "C:\data\db"
```

### Step 4: Update .env file
```env
MONGODB_URI=mongodb://localhost:27017/business-billing
```

## Option 3: Use Docker (if you have Docker installed)

```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Your connection string will be:
# MONGODB_URI=mongodb://localhost:27017/business-billing
```

## Verify Connection

After setting up MongoDB:
1. Restart your backend server: `npm run dev`
2. Check console output for "Connected to MongoDB successfully"
3. Visit: http://localhost:5000/api/health
4. Should show: `"database": "Connected"`

## Test Your Application

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173
4. Try registering a new user
5. Create a client and bill

## Troubleshooting

### Common Issues:
1. **IP not whitelisted** (Atlas): Add your IP to Network Access
2. **Service not running** (Local): Run `net start MongoDB`
3. **Port already in use**: Change port in connection string
4. **Firewall blocking**: Allow MongoDB through Windows Firewall

### Connection String Examples:
- **Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/database`
- **Local**: `mongodb://localhost:27017/database`
- **Local with auth**: `mongodb://username:password@localhost:27017/database`
- **Docker**: `mongodb://localhost:27017/database`

If you continue having issues, the **MongoDB Atlas option with IP whitelisting** is the quickest solution!