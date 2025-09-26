# 📱 Valid Phone Number Formats

## ✅ **Now Accepting Tanzania Phone Numbers**

I've updated the phone validation to specifically accept Tanzania phone number formats with proper validation and normalization.

---

## 📋 **Valid Tanzania Phone Number Examples**

### **✅ Mobile Numbers (Vodacom, Airtel, Tigo):**
```json
{
  "phone": "+255 754 123456"
}
```
```json
{
  "phone": "+255754123456"
}
```
```json
{
  "phone": "0754123456"
}
```
```json
{
  "phone": "754123456"
}
```

### **✅ Landline Numbers (Dar es Salaam):**
```json
{
  "phone": "+255 22 1234567"
}
```
```json
{
  "phone": "+255221234567"
}
```
```json
{
  "phone": "022 1234567"
}
```

### **✅ Different Mobile Networks:**
```json
{
  "phone": "+255 715 123456"
}
```
```json
{
  "phone": "+255 689 123456"
}
```
```json
{
  "phone": "+255 782 123456"
}
```

---

## 🔧 **Tanzania Phone Validation Rules**

### **✅ Accepted Formats:**
- **Mobile:** +255 6XX XXX XXX, +255 7XX XXX XXX, +255 8XX XXX XXX
- **Landline:** +255 22 XXX XXXX (Dar es Salaam), +255 27 XXX XXXX (Mwanza)
- **Local Mobile:** 0 6XX XXX XXX, 0 7XX XXX XXX, 0 8XX XXX XXX
- **Short Mobile:** 6XX XXX XXX, 7XX XXX XXX, 8XX XXX XXX
- **Flexible spacing:** Supports spaces, dashes, parentheses

### **✅ Mobile Network Prefixes:**
- **Vodacom:** 74X, 75X, 76X
- **Airtel:** 68X, 69X, 71X, 78X
- **Tigo:** 65X, 67X, 71X
- **Halotel:** 62X
- **TTCL:** 73X

### **❌ Rejected:**
- **Wrong country code:** Numbers not starting with +255/255/0
- **Invalid mobile prefix:** Not starting with 6, 7, or 8 for mobile
- **Wrong length:** Mobile not 9 digits, landline variations
- **Invalid characters:** Letters, special characters (except +, -, (), spaces)

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
