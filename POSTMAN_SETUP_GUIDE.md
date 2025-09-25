# 📬 Postman Setup Guide - Velaa Vehicle Management API

## 🚀 **Quick Start**

### **1. Import the Collection**
1. Open Postman
2. Click **Import** button
3. Select **File** and choose `Velaa-API-Collection.postman_collection.json`
4. Click **Import**

### **2. Environment Variables**
The collection includes these pre-configured variables:
- `baseUrl`: `http://localhost:5001/api`
- `authToken`: Auto-populated after login
- `userId`: Auto-populated after registration/login
- `testPhone`: `+1234567890`
- `testOTP`: `1234` (development default)

---

## 🔄 **Testing the New Registration Flow**

### **Step 1: Start Your Server**
```bash
cd /Users/muhammadosama/Projects/Velaa-Backend
npm start
# Server should start on port 5001
```

### **Step 2: Test Registration Flow**

#### **2a. Step 1: Register User**
- 📁 Navigate to: `🔐 Authentication` → `📝 Registration Flow (New)` → `Step 1: Register User`
- ✅ **Pre-filled data:**
  ```json
  {
    "ownerManagerName": "John Doe",
    "warehouseName": "Main Warehouse", 
    "phone": "+1234567890"
  }
  ```
- 🔥 **Click Send**
- ✅ **Expected Response:** Status 201, `otpSent: true`, `nextStep: "complete-registration"`

#### **2b. Step 2: Complete Registration**
- 📁 Navigate to: `Step 2: Complete Registration`
- ✅ **Pre-filled data:**
  ```json
  {
    "phone": "+1234567890",
    "otp": "1234",
    "password": "SecurePass123!"
  }
  ```
- 🔥 **Click Send**
- ✅ **Expected Response:** Status 200, JWT token, user with `status: "verified"`

### **Step 3: Test Login**
- 📁 Navigate to: `📝 Login & Authentication` → `Login User`
- 🔥 **Click Send** (uses same phone/password from registration)
- ✅ **Expected Response:** JWT token auto-saved for subsequent requests

---

## 🧪 **Complete Test Sequence**

### **🎯 Recommended Testing Order:**

1. **🔐 Authentication Flow**
   - ✅ Step 1: Register User
   - ✅ Step 2: Complete Registration  
   - ✅ Login User
   - ✅ Get Profile
   - ✅ Update Profile
   - ✅ Logout User

2. **🚗 Vehicle Management**
   - ✅ Create Vehicle
   - ✅ Get All Vehicles
   - ✅ Get Vehicle by ID
   - ✅ Update Vehicle
   - ✅ Search Vehicles
   - ✅ Get Vehicle Statistics
   - ✅ Delete Vehicle

3. **👥 Client Management**
   - ✅ Create Client
   - ✅ Get All Clients

4. **💰 Billing & Dashboard**
   - ✅ Get Billing Records
   - ✅ Get Dashboard Stats

5. **🔧 System Health**
   - ✅ Health Check
   - ✅ API Documentation

---

## ⚙️ **Advanced Features**

### **🔄 Auto-Token Management**
- ✅ JWT tokens are **automatically captured** after login/registration
- ✅ All authenticated endpoints use `{{authToken}}` variable
- ✅ No manual token copying required!

### **📊 Built-in Tests**
Each request includes automatic tests:
- ✅ **Status code validation**
- ✅ **Response structure checks**
- ✅ **Data consistency verification**
- ✅ **Variable auto-population**

### **🎯 Variable Auto-Population**
- `userId` → Auto-set after registration
- `vehicleId` → Auto-set after creating vehicle
- `authToken` → Auto-set after login/registration

---

## 🛠 **Customization**

### **Change Base URL**
1. Click collection settings (⚙️)
2. Go to **Variables** tab
3. Update `baseUrl` value
4. **Save**

### **Change Test Data**
Update these variables:
- `testPhone` → Your test phone number
- `testOTP` → Custom OTP (if not using development mode)

### **Add Environment**
1. Create new **Environment**
2. Add variables:
   ```
   baseUrl: http://your-production-url.com/api
   testPhone: +your-phone
   testOTP: your-otp
   ```

---

## 🚨 **Troubleshooting**

### **❌ Connection Refused**
```
Error: connect ECONNREFUSED 127.0.0.1:5001
```
**Solution:** Make sure your server is running on port 5001

### **❌ Invalid OTP**
```
{"success": false, "message": "Invalid OTP"}
```
**Solution:** Use `1234` as OTP in development mode

### **❌ User Already Exists**
```
{"success": false, "message": "User already exists with this phone number"}
```
**Solution:** Change the `testPhone` variable or delete the existing user

### **❌ Database Connection**
```
Database connection error: connect ECONNREFUSED
```
**Solution:** 
1. Start MongoDB locally, OR
2. Set `MONGODB_URI` in your `.env` file

### **❌ Missing Auth Token**
```
{"success": false, "message": "Access denied. No token provided"}
```
**Solution:** Run the login request first to populate `{{authToken}}`

---

## 📋 **Testing Checklist**

### **✅ Basic Flow**
- [ ] Register User (Step 1)
- [ ] Complete Registration (Step 2)  
- [ ] Login User
- [ ] Get Profile

### **✅ Vehicle Operations**
- [ ] Create Vehicle
- [ ] Get All Vehicles
- [ ] Update Vehicle
- [ ] Delete Vehicle

### **✅ Error Handling**
- [ ] Test with invalid OTP
- [ ] Test with missing fields
- [ ] Test without authentication

### **✅ Edge Cases**
- [ ] Register with existing phone
- [ ] Login with wrong password
- [ ] Access protected routes without token

---

## 🎯 **Pro Tips**

1. **🔄 Use Collection Runner**
   - Select the entire collection
   - Click **Run** to test all endpoints sequentially

2. **📊 Monitor Responses**
   - Check **Test Results** tab after each request
   - View **Console** for detailed logs

3. **🎨 Organize Tests**
   - Use folders to group related tests
   - Create different environments for dev/staging/prod

4. **⚡ Quick Testing**
   - Use `Ctrl/Cmd + Enter` to send requests quickly
   - Set up **pre-request scripts** for dynamic data

---

## 📞 **Support**

### **🆘 Need Help?**
- 📖 **API Docs:** `GET http://localhost:5001/api/docs`
- 🔍 **Health Check:** `GET http://localhost:5001/health`
- 📝 **Collection Issues:** Check this guide's troubleshooting section

### **🚀 Ready to Test!**
Your Postman collection is now configured with:
- ✅ **Complete API coverage**
- ✅ **Automatic authentication**
- ✅ **Built-in testing**
- ✅ **Variable management**
- ✅ **Error handling**

**Happy Testing! 🎉**
