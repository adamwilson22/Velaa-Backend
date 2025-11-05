# Environment Variables Analysis

## Summary

After analyzing your codebase, I found that **only 5-6 variables are actually required** for production deployment. The rest are either:
- Not used in the codebase
- Have hardcoded defaults
- Are for future features

---

## ✅ Actually Used Variables

### 🔴 Critical (Must Set)

1. **`NODE_ENV`**
   - Used in: `app.js`, `auth.js`, `jwt.js`, `rateLimiter.js`, `authController.js`
   - Must be: `production`
   - Purpose: Controls environment-specific behavior

2. **`MONGODB_URI`**
   - Used in: `database.js`
   - Required: ✅ Yes
   - Your value: `mongodb+srv://devapptage:uKMebmZpgNfCZA7j@cluster0.kvpuxgv.mongodb.net/velaa_vehicle_management`

3. **`JWT_SECRET`**
   - Used in: `jwt.js` (line 3)
   - Required: ✅ Yes (has fallback but should be set)
   - Purpose: Signs JWT tokens

4. **`ALLOWED_ORIGINS`**
   - Used in: `app.js` (line 68)
   - Required: ✅ Yes (critical for CORS!)
   - Purpose: Controls which domains can access your API

### 🟡 Recommended (Optional but Good to Set)

5. **`JWT_EXPIRE`**
   - Used in: `jwt.js` (line 4)
   - Default: `7d`
   - Recommended to set explicitly

6. **`JWT_REFRESH_EXPIRE`**
   - Used in: `jwt.js` (line 5)
   - Default: `30d`
   - Recommended to set explicitly

7. **`MOCK_SMS`**
   - Used in: `authController.js` (line 265)
   - Default: Not set (SMS service uses mock by default)
   - Set to: `true` (since SMS is currently mocked)

### 🟢 Optional - Twilio (Only if Real SMS Needed)

8. **`TWILIO_ACCOUNT_SID`**
   - Used in: `sms.js` (line 4)
   - Required: ❌ No (has mock fallback)
   - Current: Using mock SMS (always returns OTP: 1234)

9. **`TWILIO_AUTH_TOKEN`**
   - Used in: `sms.js` (line 5)
   - Required: ❌ No (has mock fallback)

10. **`TWILIO_PHONE_NUMBER`**
    - Used in: `sms.js` (line 6)
    - Required: ❌ No (has mock fallback)

---

## ❌ Not Used Variables (Can Skip)

These variables are **NOT found** in your codebase:

- `PORT` - Vercel auto-assigns ports, not used
- `SESSION_SECRET` - Not found anywhere in code
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` - Only referenced in `emailService.js` but email service not actively used
- `REDIS_URL`, `CACHE_TTL` - Redis not implemented
- `BACKUP_PATH`, `AUTO_BACKUP`, `BACKUP_INTERVAL` - Backup feature not implemented
- `LOG_FILE` - Uses console logging, not file logging
- `DEBUG` - Not used
- `MAX_FILE_SIZE`, `UPLOAD_PATH` - Hardcoded in `upload.js` (5MB for images, 10MB for docs)
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` - Hardcoded in `rateLimiter.js`
- `BCRYPT_SALT_ROUNDS` - Uses bcrypt library defaults
- `ENABLE_EMAIL_NOTIFICATIONS`, `ENABLE_SMS_NOTIFICATIONS`, `ENABLE_PUSH_NOTIFICATIONS` - Not found in code
- `MOCK_EMAIL` - Not found in code
- `API_VERSION`, `API_PREFIX` - Hardcoded as `/api` in routes

---

## 📋 Minimal Production Configuration

For Vercel deployment, you only need these **5 variables**:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://devapptage:uKMebmZpgNfCZA7j@cluster0.kvpuxgv.mongodb.net/velaa_vehicle_management
JWT_SECRET=07ee73db58055957d74cbb26dfc745446faf28f3150eba28511f385de9f92666880340b9c133eed7440f59f431917de089263dd96a55ed39b0fed5845c54cec8
ALLOWED_ORIGINS=https://your-frontend-app.vercel.app,http://localhost:3000
MOCK_SMS=true
```

**Optional but recommended:**
```env
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
```

---

## 🔍 Code Analysis Results

### Variables Found in Code:
- ✅ `NODE_ENV` - 32 occurrences
- ✅ `MONGODB_URI` - 2 occurrences
- ✅ `JWT_SECRET` - 1 occurrence
- ✅ `JWT_EXPIRE` - 1 occurrence
- ✅ `JWT_REFRESH_EXPIRE` - 1 occurrence
- ✅ `ALLOWED_ORIGINS` - 1 occurrence
- ✅ `TWILIO_ACCOUNT_SID` - 1 occurrence
- ✅ `TWILIO_AUTH_TOKEN` - 1 occurrence
- ✅ `TWILIO_PHONE_NUMBER` - 1 occurrence
- ✅ `MOCK_SMS` - 1 occurrence
- ✅ `SMTP_FROM`, `SMTP_USER` - 1 occurrence (in emailService.js, but service not actively used)

### Variables NOT Found:
- ❌ `SESSION_SECRET`
- ❌ `PORT` (used in server.js but Vercel handles this)
- ❌ All `SMTP_*` except `SMTP_FROM` and `SMTP_USER`
- ❌ All `REDIS_*`
- ❌ All `BACKUP_*`
- ❌ `LOG_FILE`, `DEBUG`
- ❌ `MAX_FILE_SIZE`, `UPLOAD_PATH`
- ❌ `RATE_LIMIT_*`
- ❌ `BCRYPT_SALT_ROUNDS`
- ❌ `ENABLE_*_NOTIFICATIONS`
- ❌ `MOCK_EMAIL`

---

## 🎯 Recommendation

**For immediate deployment:**
1. Set only the 5 critical variables listed above
2. Set `MOCK_SMS=true` (since SMS is currently mocked)
3. Update `ALLOWED_ORIGINS` after frontend is deployed

**For future:**
- Add Twilio credentials when you want real SMS
- Add other variables as you implement those features

---

## 📝 Quick Reference

See `VERCEL_ENV_MINIMAL.txt` for the exact values to copy-paste into Vercel.

