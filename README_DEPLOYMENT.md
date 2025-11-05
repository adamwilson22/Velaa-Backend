# Backend Deployment Instructions

## Quick Deploy to Vercel

### Prerequisites
- Vercel account (sign up at https://vercel.com)
- MongoDB Atlas account (sign up at https://www.mongodb.com/cloud/atlas)
- Twilio account for SMS (https://www.twilio.com)

### Step 1: Set Up MongoDB Atlas

1. Create a cluster at https://cloud.mongodb.com
2. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/velaa`
3. Whitelist all IPs (0.0.0.0/0) in Network Access

### Step 2: Deploy Using CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Step 3: Configure Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables (see `VERCEL_ENV_VARIABLES.txt` for all variables):

**CRITICAL:**
- `NODE_ENV` = production
- `MONGODB_URI` = (your MongoDB Atlas connection string)
- `JWT_SECRET` = (generate using: `openssl rand -hex 64`)
- `SESSION_SECRET` = (generate using: `openssl rand -hex 64`)
- `TWILIO_ACCOUNT_SID` = (from Twilio dashboard)
- `TWILIO_AUTH_TOKEN` = (from Twilio dashboard)
- `TWILIO_PHONE_NUMBER` = (your Twilio phone)
- `ALLOWED_ORIGINS` = (your frontend URL after deployment)

### Step 4: Redeploy

After adding environment variables:
1. Go to Deployments tab
2. Click "Redeploy" on latest deployment

## Files Configured

- ✅ `vercel.json` - Deployment configuration
- ✅ `api/index.js` - Serverless entry point
- ✅ `.vercelignore` - Files excluded from deployment
- ✅ `VERCEL_ENV_VARIABLES.txt` - All environment variables template

## Test Deployment

Visit: `https://your-backend-project.vercel.app/api/health`

Should return: `{"status":"ok"}`

## Automatic Deployments

- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment

---

For complete deployment guide, see: `../VERCEL_DEPLOYMENT_GUIDE.md`

