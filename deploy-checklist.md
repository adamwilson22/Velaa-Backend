# 🚀 Deployment Checklist

## Pre-Deployment

### Backend
- [ ] MongoDB Atlas cluster created
- [ ] Database connection string obtained
- [ ] Twilio account set up (SID, Auth Token, Phone Number)
- [ ] JWT secret generated (use: `openssl rand -hex 64`)
- [ ] Session secret generated (use: `openssl rand -hex 64`)
- [ ] All changes committed and pushed to GitHub

### Frontend
- [ ] All changes committed and pushed to GitHub
- [ ] Ready to update API URL after backend deployment

---

## Deployment Steps

### 1. Deploy Backend

```bash
cd Velaa-Backend
vercel --prod
```

**After deployment:**
- [ ] Note backend URL: `https://_________________.vercel.app`
- [ ] Add environment variables in Vercel dashboard (use `VERCEL_ENV_VARIABLES.txt`)
- [ ] Redeploy after adding environment variables
- [ ] Test health endpoint: `https://your-backend.vercel.app/api/health`

### 2. Deploy Frontend

**Before deploying:**
- [ ] Update `Frontend/js/config.js` line 65 with backend URL
- [ ] Commit and push the change

```bash
cd Frontend
vercel --prod
```

**After deployment:**
- [ ] Note frontend URL: `https://_________________.vercel.app`
- [ ] Update backend `ALLOWED_ORIGINS` with frontend URL
- [ ] Redeploy backend

### 3. Final Configuration

- [ ] Update CORS: Backend `ALLOWED_ORIGINS` includes frontend URL
- [ ] Test login flow
- [ ] Test vehicle creation
- [ ] Test client creation
- [ ] Verify SMS sending (OTP)
- [ ] Check all API endpoints work

---

## Environment Variables to Set in Vercel Backend

Go to: Backend Project → Settings → Environment Variables

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
SESSION_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

---

## Verification Tests

### Backend Health Check
```bash
curl https://your-backend.vercel.app/api/health
```
Expected: `{"status":"ok","timestamp":"..."}`

### Frontend Access
Visit: `https://your-frontend.vercel.app`
- [ ] Login page loads
- [ ] No console errors
- [ ] Can login successfully

### API Integration
- [ ] Login works
- [ ] Dashboard loads
- [ ] Vehicles list loads
- [ ] Clients list loads

---

## Troubleshooting

### CORS Error
- Update `ALLOWED_ORIGINS` in backend
- Redeploy backend

### MongoDB Connection Error
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas Network Access allows `0.0.0.0/0`

### SMS Not Sending
- Verify Twilio credentials
- Check Twilio account balance
- Set `MOCK_SMS=false` in production

---

## Quick Commands

```bash
# Generate secrets
openssl rand -hex 64

# View logs
vercel logs https://your-backend.vercel.app

# Redeploy
vercel --prod --force
```

---

## Support

See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.

