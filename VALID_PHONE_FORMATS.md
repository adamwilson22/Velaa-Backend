# 📱 Valid Phone Number Formats

## ✅ **Now Accepting International Phone Numbers**

I've updated the phone validation to accept international phone number formats instead of just Indian numbers.

---

## 📋 **Valid Phone Number Examples**

### **✅ US/Canada Format:**
```json
{
  "phone": "+1234567890"
}
```
```json
{
  "phone": "1234567890"
}
```
```json
{
  "phone": "+1 (234) 567-890"
}
```

### **✅ Indian Format:**
```json
{
  "phone": "+919876543210"
}
```
```json
{
  "phone": "9876543210"
}
```
```json
{
  "phone": "+91 98765 43210"
}
```

### **✅ UK Format:**
```json
{
  "phone": "+447911123456"
}
```
```json
{
  "phone": "07911123456"
}
```

### **✅ Other International:**
```json
{
  "phone": "+86123456789012"
}
```
```json
{
  "phone": "+491234567890"
}
```

---

## 🔧 **Validation Rules**

### **✅ Accepted:**
- **Length:** 10-15 digits (after removing spaces, dashes, parentheses)
- **Format:** Can include `+`, spaces, dashes, parentheses
- **Examples:**
  - `+1234567890`
  - `1234567890`
  - `+1 (234) 567-890`
  - `+91 98765 43210`
  - `123-456-7890`

### **❌ Rejected:**
- **Too short:** Less than 10 digits
- **Too long:** More than 15 digits
- **Invalid characters:** Letters, special characters (except +, -, (), spaces)
- **Examples:**
  - `123456789` (too short)
  - `1234567890123456` (too long)
  - `abc123456789` (contains letters)
  - `123@456#7890` (invalid characters)

---

## 🧪 **Quick Test Examples**

### **For Postman/API Testing:**

#### **✅ Working Registration Request:**
```json
{
  "ownerManagerName": "John Doe",
  "warehouseName": "Main Warehouse",
  "phone": "+1234567890"
}
```

#### **✅ Alternative Valid Phones:**
```json
{
  "ownerManagerName": "Jane Smith",
  "warehouseName": "Second Warehouse",
  "phone": "9876543210"
}
```

```json
{
  "ownerManagerName": "Bob Wilson",
  "warehouseName": "Third Warehouse",
  "phone": "+91 98765 43210"
}
```

---

## 📱 **Recommended Test Phone Numbers**

### **For Development/Testing:**
- `+1234567890` - Simple US format
- `1234567890` - Simple 10-digit
- `+919876543210` - Indian format
- `+447911123456` - UK format

### **Current Postman Collection Default:**
```json
{
  "testPhone": "+1234567890"
}
```

---

## 🔄 **What Changed**

### **❌ Before (Indian Only):**
```javascript
// Only accepted Indian numbers starting with 6-9
const phoneRegex = /^[+]?[6-9]\d{9}$/;
```

### **✅ After (International):**
```javascript
// Accepts any international format, 10-15 digits
const phoneRegex = /^[+]?\d{10,15}$/;
```

---

## 🎯 **Usage in Your APIs**

### **Registration Request:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "ownerManagerName": "John Doe",
    "warehouseName": "Main Warehouse",
    "phone": "+1234567890"
  }'
```

### **Complete Registration:**
```bash
curl -X POST http://localhost:5001/api/auth/complete-registration \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "otp": "1234",
    "password": "SecurePass123!"
  }'
```

---

## ✅ **Ready to Test**

Your phone validation now accepts:
- ✅ **US numbers:** +1234567890
- ✅ **Indian numbers:** +919876543210  
- ✅ **UK numbers:** +447911123456
- ✅ **Any international format:** 10-15 digits
- ✅ **Flexible formatting:** With/without +, spaces, dashes, parentheses

**Try any of the valid formats above and your registration should work!** 📱✨
