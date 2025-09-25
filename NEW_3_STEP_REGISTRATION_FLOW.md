# 🚀 New 3-Step Registration Flow - Complete Implementation

## 📋 **Overview**

The registration process has been redesigned into **3 separate API calls** with **3 separate pages** for better UX and security:

```
Step 1: Register → Step 2: Verify OTP → Step 3: Create Password
```

---

## 🔄 **Flow Design**

### **✅ Step 1: Register Basic Info**
- **Page:** Registration form
- **Fields:** Warehouse Name, Owner Manager Name, Phone Number
- **API:** `POST /api/auth/register`
- **Result:** OTP sent to phone, user status = `'pending'`

### **✅ Step 2: Verify OTP**
- **Page:** OTP verification form  
- **Fields:** Phone Number, OTP Code
- **API:** `POST /api/auth/verify-otp`
- **Result:** OTP verified, user status = `'otp-verified'`, `isOtpVerified = true`

### **✅ Step 3: Create Password**
- **Page:** Password creation form
- **Fields:** Phone Number, Password
- **API:** `POST /api/auth/complete-registration`
- **Result:** Registration complete, user status = `'active'`, JWT token issued

---

## 🔧 **API Endpoints**

### **📝 Step 1: POST `/api/auth/register`**

**Request:**
```json
{
  "ownerManagerName": "John Doe",
  "warehouseName": "Main Warehouse", 
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration initiated. Please verify your phone number with the OTP sent.",
  "data": {
    "userId": "68d4fca5856f80973fd204ff",
    "phone": "+1234567890",
    "ownerManagerName": "John Doe",
    "warehouseName": "Main Warehouse",
    "otpSent": true,
    "nextStep": "verify-otp"
  }
}
```

### **🔐 Step 2: POST `/api/auth/verify-otp`**

**Request:**
```json
{
  "phone": "+1234567890",
  "otp": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully! Now create your password.",
  "data": {
    "user": {
      "id": "68d4fca5856f80973fd204ff",
      "ownerManagerName": "John Doe",
      "phone": "+1234567890",
      "warehouseName": "Main Warehouse",
      "status": "otp-verified",
      "isPhoneVerified": true,
      "isOtpVerified": true
    },
    "nextStep": "create-password"
  }
}
```

### **🔑 Step 3: POST `/api/auth/complete-registration`**

**Request:**
```json
{
  "phone": "+1234567890",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration completed successfully! You can now use your account.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "68d4fca5856f80973fd204ff",
      "ownerManagerName": "John Doe",
      "phone": "+1234567890",
      "warehouseName": "Main Warehouse",
      "status": "active",
      "role": "user",
      "isPhoneVerified": true,
      "isOtpVerified": true,
      "createdAt": "2025-09-25T08:26:13.701Z"
    }
  }
}
```

---

## 📱 **Frontend Implementation Guide**

### **🎨 Page 1: Registration Form**
```jsx
const [formData, setFormData] = useState({
  ownerManagerName: '',
  warehouseName: '',
  phone: ''
});

const handleRegister = async () => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  const result = await response.json();
  if (result.success) {
    // Store phone for next steps
    localStorage.setItem('registrationPhone', formData.phone);
    // Navigate to OTP verification page
    navigate('/verify-otp');
  }
};
```

### **🔐 Page 2: OTP Verification**
```jsx
const [otpData, setOtpData] = useState({
  phone: localStorage.getItem('registrationPhone'),
  otp: ''
});

const handleVerifyOTP = async () => {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(otpData)
  });
  
  const result = await response.json();
  if (result.success) {
    // Navigate to password creation page
    navigate('/create-password');
  }
};
```

### **🔑 Page 3: Password Creation**
```jsx
const [passwordData, setPasswordData] = useState({
  phone: localStorage.getItem('registrationPhone'),
  password: ''
});

const handleCompleteRegistration = async () => {
  const response = await fetch('/api/auth/complete-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passwordData)
  });
  
  const result = await response.json();
  if (result.success) {
    // Store auth token
    localStorage.setItem('authToken', result.data.token);
    localStorage.removeItem('registrationPhone');
    // Navigate to dashboard
    navigate('/dashboard');
  }
};
```

---

## 🗃️ **Database Schema Changes**

### **User Model Updates:**
```javascript
{
  ownerManagerName: String,    // ✅ Required
  phone: String,              // ✅ Required, Unique
  warehouseName: String,      // ✅ Required
  password: String,           // ✅ Required only when status='active'
  status: {                   // ✅ Updated enum
    type: String,
    enum: ['pending', 'otp-verified', 'active', 'inactive'],
    default: 'pending'
  },
  isPhoneVerified: Boolean,   // ✅ Existing
  isOtpVerified: Boolean,     // ✅ NEW FIELD
  // email field completely removed ❌
}
```

### **Status Flow:**
```
pending → otp-verified → active
```

---

## 🎯 **Validation Rules**

### **Step 1 Validation:**
- `ownerManagerName`: Required, 2-100 characters
- `warehouseName`: Required, 2-100 characters  
- `phone`: Required, international format (10-15 digits)

### **Step 2 Validation:**
- `phone`: Required, must match registration phone
- `otp`: Required, exactly 4 digits (dummy: always `1234`)

### **Step 3 Validation:**
- `phone`: Required, must match verified phone
- `password`: Required, min 6 characters with uppercase, lowercase, numbers

---

## 🔒 **Security Features**

### **✅ OTP Verification:**
- Dummy OTP: `1234` (for development)
- User must complete Step 2 before Step 3
- Phone number consistency across all steps

### **✅ Status Checks:**
- Step 2 requires user status = `'pending'`
- Step 3 requires user status = `'otp-verified'` 
- Step 3 requires `isOtpVerified = true`

### **✅ Rate Limiting:**
- Registration: 10 attempts per 15 minutes
- OTP verification: 5 attempts per hour
- Complete registration: 10 attempts per 15 minutes

---

## 🧪 **Testing with Postman**

### **📋 Test Sequence:**

1. **Run Step 1:** Register User
   - Should return `nextStep: "verify-otp"`
   - User status = `pending`

2. **Run Step 2:** Verify OTP  
   - Use OTP: `1234`
   - Should return `nextStep: "create-password"`
   - User status = `otp-verified`

3. **Run Step 3:** Complete Registration
   - Should return JWT token
   - User status = `active`

### **📱 Test Phone Numbers:**
- `+1234567890` (US format)
- `+919876543210` (Indian format)
- `+447911123456` (UK format)

---

## ❌ **Error Handling**

### **Common Errors:**

**Step 2 called before Step 1:**
```json
{
  "success": false,
  "message": "User not found or OTP already verified"
}
```

**Step 3 called before Step 2:**
```json
{
  "success": false,
  "message": "User not found or OTP not verified yet"
}
```

**Invalid OTP:**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

## ✅ **Benefits of 3-Step Flow**

### **🎯 Better UX:**
- ✅ Clear progress indication
- ✅ Focused single-purpose pages
- ✅ Better error handling per step
- ✅ User can restart at any step

### **🔒 Better Security:**
- ✅ OTP verification before password creation
- ✅ Phone number ownership verified
- ✅ Separate validation per step
- ✅ Status-based access control

### **💻 Better Development:**
- ✅ Modular API design
- ✅ Independent page components
- ✅ Clear separation of concerns
- ✅ Easier testing and debugging

---

## 🚀 **Ready to Use!**

The new 3-step registration flow is **fully implemented** and **tested**. You can now build separate frontend pages for each step and provide users with a smooth, secure registration experience!

**Each step has its own API, validation, and purpose - perfect for modern frontend frameworks!** 🎉
