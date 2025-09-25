# 📮 Postman Collection Import Guide

## 🚀 **Quick Start Guide**

This guide will help you import and use the Velaa Vehicle Management API collection in Postman to test all Authentication and Vehicle Management endpoints.

---

## 📁 **Step 1: Import the Collection**

### **Method 1: Import from File**
1. **Open Postman** application
2. Click **"Import"** button (top-left corner)
3. Select **"Upload Files"** tab
4. Choose the file: `Velaa-API-Collection.postman_collection.json`
5. Click **"Import"** button
6. ✅ Collection imported successfully!

### **Method 2: Import from URL** (if hosted)
1. **Open Postman** application
2. Click **"Import"** button
3. Select **"Link"** tab
4. Paste the collection URL
5. Click **"Continue"** → **"Import"**

---

## ⚙️ **Step 2: Configure Environment Variables**

### **Set Base URL:**
1. Go to **Collections** → **"Velaa Vehicle Management API"**
2. Click on **"Variables"** tab
3. Set `baseUrl` value to: `http://localhost:3000/api`
4. Click **"Save"**

### **Environment Variables Included:**
- `baseUrl`: API base URL (default: http://localhost:3000/api)
- `authToken`: JWT token (auto-populated after login)
- `userId`: User ID (auto-populated after registration/login)
- `vehicleId`: Vehicle ID (auto-populated after creating vehicle)

---

## 🔐 **Step 3: Authentication Setup**

### **Important Notes:**
- 🔑 **Default OTP**: `1234` (for all OTP verifications)
- 🚀 **Development Mode**: SMS is mocked (check console logs)
- 🔒 **JWT Token**: Auto-saved after successful login

### **Authentication Flow:**
1. **Register User** → Get user ID
2. **Verify OTP** → Use OTP: `1234`
3. **Login** → Get JWT token (auto-saved)
4. **All other APIs** → Use saved token automatically

---

## 📋 **Step 4: Testing Workflow**

### **🔐 Authentication Testing Order:**

#### **A. Public Routes (No Auth Required):**
```
1. Register User          → Creates new user
2. Verify OTP            → Verifies with OTP: 1234
3. Login User            → Gets JWT token
4. Forgot Password       → Initiates recovery
5. Verify Recovery OTP   → Verifies with OTP: 1234
6. Reset Password        → Resets password
```

#### **B. Profile Management (Auth Required):**
```
7. Get Profile           → View user profile
8. Update Profile        → Update user info
9. Change Password       → Change password
10. Send Phone Verification → Send OTP
11. Verify Phone Number  → Verify with OTP: 1234
12. Logout              → Logout user
```

#### **C. Admin Management (Admin Role Required):**
```
13. Get All Users        → List all users
14. Get User by ID       → Get specific user
15. Update User          → Update user (admin)
16. Delete User          → Delete user (admin)
17. Get User Statistics  → Admin dashboard stats
```

### **🚗 Vehicle Management Testing Order:**

#### **A. Vehicle CRUD:**
```
1. Create Vehicle        → Creates new vehicle (saves ID)
2. Get All Vehicles      → List with filters
3. Get Vehicle by ID     → Get specific vehicle
4. Update Vehicle        → Update vehicle info
5. Delete Vehicle        → Delete vehicle (Manager+)
```

#### **B. Search & Filter:**
```
6. Search Vehicles       → Advanced search with filters
```

#### **C. Status Management:**
```
7. Update Vehicle Status → Change status with rules
```

#### **D. File Management:**
```
8. Upload Vehicle Images    → Upload images
9. Upload Vehicle Documents → Upload documents
10. Delete Vehicle Image    → Remove image
11. Delete Vehicle Document → Remove document
```

#### **E. Maintenance & Defects:**
```
12. Get Maintenance History → View maintenance
13. Add Maintenance Record  → Add maintenance
14. Get Vehicle Defects     → View defects
15. Add Vehicle Defect      → Add defect
```

#### **F. Analytics:**
```
16. Get Vehicle Statistics  → Dashboard analytics
```

---

## 🎯 **Step 5: Sample Test Data**

### **User Registration Data:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+919876543210",
  "password": "SecurePass123!",
  "role": "User",
  "warehouseName": "Main Warehouse",
  "warehouseAddress": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  }
}
```

### **Vehicle Creation Data:**
```json
{
  "chassisNumber": "MAHN1234567890123",
  "engineNumber": "ENG123456789",
  "registrationNumber": "MH01AB1234",
  "brand": "Maruti Suzuki",
  "model": "Swift",
  "variant": "VXI",
  "year": 2023,
  "color": "Pearl White",
  "fuelType": "Petrol",
  "transmission": "Manual",
  "engineCapacity": 1197,
  "mileage": 23.76,
  "seatingCapacity": 5,
  "owner": "{{userId}}",
  "ownershipType": "First Owner",
  "condition": "Excellent",
  "purchasePrice": 650000,
  "sellingPrice": 580000,
  "marketValue": 600000,
  "purchaseDate": "2023-01-15",
  "registrationDate": "2023-01-20",
  "insuranceExpiryDate": "2024-01-20",
  "pucExpiryDate": "2024-07-20",
  "location": {
    "warehouse": "Main Warehouse",
    "section": "A1",
    "row": "1",
    "position": "5"
  },
  "features": ["ABS", "Airbags", "Power Steering", "AC", "Music System"],
  "tags": ["popular", "fuel-efficient", "compact"],
  "notes": "Well maintained vehicle with complete service history"
}
```

---

## 🔧 **Step 6: Server Setup**

### **Before Testing APIs:**

1. **Start MongoDB:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

2. **Create .env file:**
   ```bash
   cp env.example .env
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Start Server:**
   ```bash
   npm start
   # or
   npm run dev
   ```

5. **Verify Server:**
   - Open: http://localhost:3000/api/health
   - Should return: `{"success": true, "message": "API is running"}`

---

## 📊 **Step 7: Collection Features**

### **🔄 Auto-Variables:**
- **JWT Token**: Auto-saved after login
- **User ID**: Auto-saved after registration
- **Vehicle ID**: Auto-saved after vehicle creation

### **📝 Pre-filled Data:**
- **Sample requests**: Ready-to-use test data
- **Query parameters**: Pre-configured filters
- **Headers**: Auto-authentication setup

### **🧪 Test Scripts:**
- **Token extraction**: Auto-saves JWT tokens
- **ID extraction**: Auto-saves resource IDs
- **Response validation**: Basic response checks

---

## 🚨 **Step 8: Troubleshooting**

### **Common Issues:**

#### **❌ "Unauthorized" Error:**
- **Solution**: Login first to get JWT token
- **Check**: Token is saved in collection variables

#### **❌ "User not found" Error:**
- **Solution**: Register user first
- **Check**: Use correct phone number format (+91xxxxxxxxxx)

#### **❌ "Invalid OTP" Error:**
- **Solution**: Use default OTP: `1234`
- **Check**: OTP type matches (registration/recovery/phone_verification)

#### **❌ "Vehicle not found" Error:**
- **Solution**: Create vehicle first
- **Check**: Vehicle ID is saved in collection variables

#### **❌ "Connection refused" Error:**
- **Solution**: Start the backend server
- **Check**: Server running on http://localhost:3000

#### **❌ "Validation failed" Error:**
- **Solution**: Check request body format
- **Check**: Required fields are provided

---

## 📈 **Step 9: Advanced Usage**

### **🔍 Search Examples:**
```
# Search by text
GET /vehicles/search?q=Swift

# Filter by brand and price
GET /vehicles/search?brand=Maruti&minPrice=500000&maxPrice=700000

# Multiple filters
GET /vehicles/search?fuelType=Petrol&transmission=Manual&year=2023
```

### **📄 Pagination Examples:**
```
# First page, 10 items
GET /vehicles?page=1&limit=10

# Second page, 20 items
GET /vehicles?page=2&limit=20

# Sort by price (ascending)
GET /vehicles?sort=sellingPrice

# Sort by date (descending)
GET /vehicles?sort=-createdAt
```

### **🎯 Role-based Testing:**
1. **User Role**: Basic vehicle operations
2. **Manager Role**: Vehicle deletion, advanced features
3. **Admin Role**: User management, system statistics

---

## ✅ **Step 10: Verification Checklist**

### **✅ Authentication Module:**
- [ ] User registration works
- [ ] OTP verification works (1234)
- [ ] User login successful
- [ ] JWT token auto-saved
- [ ] Profile management works
- [ ] Password change works
- [ ] Admin user management works
- [ ] User statistics available

### **✅ Vehicle Management Module:**
- [ ] Vehicle creation works
- [ ] Vehicle listing with filters
- [ ] Vehicle search functionality
- [ ] Vehicle update operations
- [ ] Status management works
- [ ] File upload works
- [ ] Maintenance tracking works
- [ ] Defect management works
- [ ] Analytics and statistics

---

## 🎉 **Success!**

You now have a fully functional Postman collection with:
- ✅ **33 API Endpoints** ready to test
- ✅ **Auto-authentication** setup
- ✅ **Sample test data** included
- ✅ **Complete workflows** configured
- ✅ **Error handling** examples

**Happy Testing! 🚀**

---

## 📞 **Support**

If you encounter any issues:
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure MongoDB is running
4. Check API documentation at: http://localhost:3000/api/docs

**Collection Version**: 1.0.0  
**Last Updated**: $(date)  
**Total Endpoints**: 33  
**Modules Covered**: Authentication, Vehicle Management
