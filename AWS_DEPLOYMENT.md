# AWS Deployment Guide - Monorepo Strategy

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Your GitHub Repo                │
│  ┌──────────┐      ┌──────────┐        │
│  │ Frontend │      │ Backend  │        │
│  └──────────┘      └──────────┘        │
└─────────────────────────────────────────┘
           │                  │
           ▼                  ▼
    ┌──────────┐      ┌──────────────┐
    │ AWS S3 + │      │ AWS EC2 or   │
    │CloudFront│      │Elastic Beanstalk│
    └──────────┘      └──────────────┘
```

## Recommended AWS Services

### Frontend Deployment Options:

**Option 1: AWS Amplify** (Easiest - Recommended)
- Automatic builds from GitHub
- Built-in CI/CD
- Free SSL certificate
- Global CDN

**Option 2: S3 + CloudFront**
- More control
- Lower cost for high traffic
- Manual setup

### Backend Deployment Options:

**Option 1: AWS Elastic Beanstalk** (Easiest - Recommended)
- Automatic scaling
- Load balancing
- Easy environment management
- Supports Node.js directly

**Option 2: AWS EC2**
- Full control
- Manual configuration
- Good for custom setups

**Option 3: AWS ECS (Docker)**
- Container-based
- Better for microservices
- More complex setup

## Deployment Strategy 1: Amplify + Elastic Beanstalk (Recommended)

### Frontend (AWS Amplify)

1. **Connect GitHub Repository**
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Select branch: `main`

2. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: frontend/dist
       files:
         - '**/*'
     cache:
       paths:
         - frontend/node_modules/**/*
   ```

3. **Environment Variables**
   Add in Amplify Console:
   - `VITE_API_URL`: Your backend URL (e.g., `https://api.yourdomain.com`)

4. **Deploy**
   - Amplify will auto-deploy on every push to main branch
   - You'll get a URL like: `https://main.d1234567890.amplifyapp.com`

### Backend (AWS Elastic Beanstalk)

1. **Prepare Backend**
   Create `backend/.ebextensions/nodecommand.config`:
   ```yaml
   option_settings:
     aws:elasticbeanstalk:container:nodejs:
       NodeCommand: "npm start"
   ```

2. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

3. **Initialize Elastic Beanstalk**
   ```bash
   cd backend
   eb init -p node.js-18 billing-backend --region us-east-1
   ```

4. **Create Environment**
   ```bash
   eb create billing-backend-prod
   ```

5. **Set Environment Variables**
   ```bash
   eb setenv MONGODB_URI="your-mongodb-uri" \
            JWT_SECRET="your-jwt-secret" \
            PORT=8080
   ```

6. **Deploy**
   ```bash
   eb deploy
   ```

7. **Get URL**
   ```bash
   eb status
   ```

## Deployment Strategy 2: S3 + EC2 (More Control)

### Frontend (S3 + CloudFront)

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Create S3 Bucket**
   - Go to S3 Console
   - Create bucket: `billing-app-frontend`
   - Enable static website hosting
   - Upload `dist/` contents

3. **Create CloudFront Distribution**
   - Origin: Your S3 bucket
   - Enable HTTPS
   - Set default root object: `index.html`

### Backend (EC2)

1. **Launch EC2 Instance**
   - AMI: Ubuntu 22.04
   - Instance type: t2.micro (free tier) or t3.small
   - Security group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Connect and Setup**
   ```bash
   # SSH into instance
   ssh -i your-key.pem ubuntu@your-ec2-ip

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   sudo npm install -g pm2

   # Clone repository
   git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
   cd REPO_NAME/backend

   # Install dependencies
   npm install

   # Create .env file
   nano .env
   # Add your environment variables

   # Start with PM2
   pm2 start src/server.js --name billing-backend
   pm2 startup
   pm2 save
   ```

3. **Setup Nginx Reverse Proxy**
   ```bash
   sudo apt install nginx

   sudo nano /etc/nginx/sites-available/billing-backend
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/billing-backend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Use in your backend environment variables

### Option 2: MongoDB on EC2
- Install MongoDB on same or separate EC2 instance
- Configure security groups
- More maintenance required

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and Build
        working-directory: ./frontend
        run: |
          npm ci
          npm run build
      
      - name: Deploy to Amplify
        # Amplify auto-deploys, or use AWS CLI to sync to S3
        run: echo "Deployed by Amplify"

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Elastic Beanstalk
        working-directory: ./backend
        run: |
          pip install awsebcli
          eb deploy billing-backend-prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Cost Estimation (Monthly)

### Free Tier Eligible:
- **Amplify**: 1000 build minutes/month free
- **S3**: 5GB storage, 20,000 GET requests free
- **EC2**: t2.micro 750 hours/month free (first year)
- **Elastic Beanstalk**: Free (you pay for underlying resources)

### After Free Tier:
- **Amplify**: ~$0.01 per build minute
- **S3 + CloudFront**: ~$1-5/month for small traffic
- **EC2 t3.small**: ~$15/month
- **Elastic Beanstalk**: ~$20-50/month
- **MongoDB Atlas**: Free tier available, paid starts at $9/month

## Security Checklist

- [ ] Use environment variables for secrets
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up security groups (firewall rules)
- [ ] Use IAM roles with minimal permissions
- [ ] Enable CloudWatch logging
- [ ] Set up backup for MongoDB
- [ ] Use strong JWT secrets
- [ ] Enable rate limiting

## Domain Setup

1. **Buy Domain** (Route 53, Namecheap, GoDaddy)
2. **Configure DNS**:
   - Frontend: Point to CloudFront or Amplify
   - Backend: Point to EC2 or Load Balancer
3. **SSL Certificates**: Use AWS Certificate Manager (free)

## Monitoring

- **CloudWatch**: Monitor logs and metrics
- **AWS X-Ray**: Trace requests
- **Uptime monitoring**: UptimeRobot, Pingdom

## Next Steps

1. Push code to GitHub (see PUSH_TO_GITHUB.md)
2. Choose deployment strategy
3. Set up AWS account
4. Deploy frontend first
5. Deploy backend
6. Configure environment variables
7. Test thoroughly
8. Set up monitoring

## Need Help?

- AWS Documentation: https://docs.aws.amazon.com
- AWS Free Tier: https://aws.amazon.com/free
- Amplify Docs: https://docs.amplify.aws
- Elastic Beanstalk Docs: https://docs.aws.amazon.com/elasticbeanstalk
