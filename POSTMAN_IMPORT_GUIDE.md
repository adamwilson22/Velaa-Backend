# 📮 Postman Collection Import Guide - Updated v2.0.0

## 🚀 **Quick Start Guide**

This guide will help you import and use the **updated** Velaa Vehicle Management API collection in Postman to test the new simplified registration flow and all other endpoints.

---

## 📁 **Step 1: Import the Collection**

### **Method 1: Import from File**
1. **Open Postman** application
2. Click **"Import"** button (top-left corner)
3. Select **"Upload Files"** tab
4. Choose the file: `Velaa-API-Collection.postman_collection.json`
5. Click **"Import"** button
6. ✅ Collection imported successfully!

### **Collection Info:**
- **Name**: Velaa Vehicle Management API - Updated
- **Version**: 2.0.0
- **New Features**: Simplified 2-step registration flow
- **Base URL**: `http://localhost:5001/api` (Updated port)

---

## ⚙️ **Step 2: Pre-Configured Variables**

The collection comes with these **auto-configured variables**:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:5001/api` | API base URL (updated port) |
| `authToken` | *(auto-set)* | JWT token after login |
| `userId` | *(auto-set)* | User ID after registration |
| `testPhone` | `+1234567890` | Test phone number |
| `testOTP` | `1234` | Development OTP |

**No manual configuration needed!** 🎉

---

## 🔄 **Step 3: Test the New Registration Flow**

### **🎯 New 2-Step Process:**

#### **Step 1: Register User** 
📁 `🔐 Authentication` → `📝 Registration Flow (New)` → `Step 1: Register User`

**Pre-filled Data:**
```json
{
  "ownerManagerName": "John Doe",
  "warehouseName": "Main Warehouse",
  "phone": "+1234567890"
}
```

**Expected Response:** ✅ Status 201, OTP sent, `nextStep: "complete-registration"`

#### **Step 2: Complete Registration**
📁 `Step 2: Complete Registration`

**Pre-filled Data:**
```json
{
  "phone": "+1234567890",
  "otp": "1234",
  "password": "SecurePass123!"
}
```

**Expected Response:** ✅ Status 200, JWT token, user verified

---

## 📋 **Step 4: Collection Structure**

### **🔐 Authentication** (Updated)
```
📝 Registration Flow (New)
  ├── Step 1: Register User
  └── Step 2: Complete Registration

📝 Login & Authentication  
  ├── Login User
  └── Logout User

📝 Legacy & Other Auth
  ├── Verify OTP (Legacy)
  ├── Forgot Password
  ├── Verify Recovery OTP
  └── Reset Password

👤 Profile Management
  ├── Get Profile
  ├── Update Profile
  └── Change Password
```

### **🚗 Vehicle Management**
```
📋 Vehicle CRUD
  ├── Get All Vehicles
  ├── Create Vehicle  
  ├── Get Vehicle by ID
  ├── Update Vehicle
  └── Delete Vehicle

🔍 Search & Filter
  ├── Search Vehicles
  └── Get Vehicle Statistics
```

### **👥 Client Management**
```
├── Get All Clients
└── Create Client
```

### **💰 Billing Management**
```
└── Get All Billing Records
```

### **📊 Dashboard & System**
```
Dashboard
└── Get Dashboard Stats

System
├── Health Check
└── API Documentation
```

---

## 🧪 **Step 5: Complete Testing Flow**

### **🎯 Recommended Order:**

1. **🔄 Authentication Flow**
   - ✅ Step 1: Register User
   - ✅ Step 2: Complete Registration  
   - ✅ Login User
   - ✅ Get Profile

2. **🚗 Vehicle Operations**
   - ✅ Create Vehicle
   - ✅ Get All Vehicles
   - ✅ Search Vehicles
   - ✅ Update Vehicle

3. **👥 Other Modules**
   - ✅ Create Client
   - ✅ Get Dashboard Stats
   - ✅ Health Check

---

## ⚡ **Step 6: Enhanced Features**

### **🤖 Auto-Authentication**
- JWT tokens **automatically captured** after login
- No manual token copying required
- All authenticated endpoints use `{{authToken}}`

### **📊 Built-in Tests**
- Response validation for each request
- Status code verification
- Data consistency checks
- Variable auto-population

### **🎯 Smart Variables**
- `userId` auto-set after registration
- `vehicleId` auto-set after creating vehicle
- `authToken` auto-set after login/registration

---

## 🔧 **Customization Options**

### **Change Test Data:**
1. Click collection settings (⚙️)
2. Go to **Variables** tab
3. Update values:
   - `testPhone` → Your phone number
   - `baseUrl` → Different server URL

### **Environment Setup:**
1. Create new **Environment**
2. Add variables for different stages:
   ```
   Development: http://localhost:5001/api
   Staging: https://staging.velaa.com/api
   Production: https://api.velaa.com
   ```

---

## 🚨 **Troubleshooting Guide**

### **❌ Common Issues & Solutions:**

**Connection Refused**
```
Error: connect ECONNREFUSED 127.0.0.1:5001
```
**Solution:** Ensure server is running on port 5001

**User Already Exists**
```
{"success": false, "message": "User already exists with this phone number"}
```
**Solution:** Change `testPhone` variable or use different number

**Invalid OTP**
```
{"success": false, "message": "Invalid OTP"}
```
**Solution:** Use `1234` for development mode

**Missing Auth Token**
```
{"success": false, "message": "Access denied. No token provided"}
```
**Solution:** Complete login flow first to get `{{authToken}}`

---

## 📊 **Testing Checklist**

### **✅ Basic Flow**
- [ ] Step 1: Register User
- [ ] Step 2: Complete Registration
- [ ] Login User
- [ ] Get Profile

### **✅ Vehicle Operations**
- [ ] Create Vehicle
- [ ] Get All Vehicles
- [ ] Search Vehicles
- [ ] Update Vehicle

### **✅ Error Scenarios**
- [ ] Register with existing phone
- [ ] Login with wrong password
- [ ] Use invalid OTP
- [ ] Access protected routes without token

---

## 🎯 **Pro Tips**

### **🚀 Speed Up Testing**
- Use **Collection Runner** to test multiple requests
- Press `Ctrl/Cmd + Enter` to send requests quickly
- Check **Test Results** tab for validation

### **📝 Monitor Progress**
- View **Console** for detailed request/response logs
- Use **Environment** dropdown to switch between environments
- Enable **SSL certificate verification** for production

### **🔄 Automation**
- Set up **monitors** for continuous testing
- Use **pre-request scripts** for dynamic data
- Create **workflows** for complex test scenarios

---

## 📞 **Support Resources**

### **🔗 Quick Access:**
- **API Health**: `GET http://localhost:5001/health`
- **API Docs**: `GET http://localhost:5001/api/docs`  
- **Setup Guide**: `POSTMAN_SETUP_GUIDE.md`

### **📚 Documentation:**
- **Registration Flow**: `NEW_REGISTRATION_FLOW_GUIDE.md`
- **API Reference**: `API_ENDPOINTS_REFERENCE.md`
- **Server Setup**: `README.md`

---

## 🎉 **What's New in v2.0.0**

### **✨ Major Updates:**
- ✅ **2-Step Registration** - Simplified user onboarding
- ✅ **Port Update** - Now using port 5001  
- ✅ **Auto-Testing** - Built-in response validation
- ✅ **Smart Variables** - Auto-population of tokens/IDs
- ✅ **Better Organization** - Improved folder structure
- ✅ **Complete Coverage** - All endpoints tested

### **🚀 Ready to Import!**

Your Postman collection now includes:
- ✅ **50+ API endpoints** ready to test
- ✅ **Automatic authentication** handling
- ✅ **Built-in testing scripts** for validation
- ✅ **Real-world test data** for immediate use
- ✅ **Production-ready** configuration

**Start testing in under 2 minutes! 🚀**