# Troubleshooting: "Bad Request - Missing Field" Error

## 🔴 Problem

Your n8n HTTP Request node is returning:
```
400 Bad Request
Missing required fields
```

---

## ✅ Solution

The webapp requires **4 mandatory fields**:
1. `orderId`
2. `orderNumber`
3. `customerName`
4. `customerEmail`

If ANY of these fields are missing or empty, you'll get the "Bad Request" error.

---

## 🔍 How to Debug

### Step 1: Check n8n Execution Log

1. Run your n8n workflow
2. Click on the "Send to Doctor Dashboard" HTTP Request node
3. Look at the **Response** tab
4. You should see which fields are missing:

```json
{
  "error": "Missing required fields",
  "missingFields": ["orderId", "customerName"],
  "received": {
    "orderId": null,
    "orderNumber": "52149",
    "customerName": null,
    "customerEmail": "john@example.com"
  }
}
```

This tells you exactly which fields are missing!

---

### Step 2: Check Your Data Source

The **4 required fields** need to come from your **Map Shopify to Salesforce Fields** node.

**Check if these fields exist in your mapping node:**

1. Click on "Map Shopify to Salesforce Fields" node
2. Look at the **Output** tab
3. Verify these fields are present:
   - `orderId` or `id`
   - `orderNumber` or `order_number` or `name`
   - `Name` or `customerName`
   - `customerEmail` or `email`

---

## 🔧 Fix: Use the Updated Configuration

I've created a new configuration file that handles missing fields better:

**File:** `n8n-REQUIRED-FIELDS-FIRST.json`

### Key Improvements:

1. **Fallback values** for required fields:
   ```javascript
   // orderId tries multiple sources
   "value": "={{ $('Map Shopify to Salesforce Fields').item.json.orderId || $json.orderId || $json.id }}"
   
   // orderNumber tries multiple sources
   "value": "={{ $('Map Shopify to Salesforce Fields').item.json.orderNumber || $json.orderNumber || $json.order_number || $json.name }}"
   
   // customerName tries multiple sources
   "value": "={{ $('Map Shopify to Salesforce Fields').item.json.Name || $('Map Shopify to Salesforce Fields').item.json.customerName || $json.customerName }}"
   
   // customerEmail tries multiple sources
   "value": "={{ $('Map Shopify to Salesforce Fields').item.json.customerEmail || $json.customerEmail || $json.email }}"
   ```

2. **Default "Not Provided"** for optional health fields:
   ```javascript
   "value": "={{ $('Map Shopify to Salesforce Fields').item.json.WorriedAboutFastAgingc || 'Not Provided' }}"
   ```

---

## 📋 How to Apply the Fix

### Option 1: Update Your Existing Node

1. Open your "Send to Doctor Dashboard" HTTP Request node
2. Update the **first 4 body parameters** to use fallback values:

```javascript
orderId: ={{ $('Map Shopify to Salesforce Fields').item.json.orderId || $json.orderId || $json.id }}

orderNumber: ={{ $('Map Shopify to Salesforce Fields').item.json.orderNumber || $json.orderNumber || $json.order_number || $json.name }}

customerName: ={{ $('Map Shopify to Salesforce Fields').item.json.Name || $('Map Shopify to Salesforce Fields').item.json.customerName || $json.customerName }}

customerEmail: ={{ $('Map Shopify to Salesforce Fields').item.json.customerEmail || $json.customerEmail || $json.email }}
```

3. Save and test

---

### Option 2: Use the Complete Configuration

1. **Delete all body parameters** in your HTTP Request node
2. **Copy all parameters** from `n8n-REQUIRED-FIELDS-FIRST.json`
3. **Paste** into your node
4. **Save** and test

---

## 🧪 Test Your Fix

### Step 1: Execute Workflow
1. Run your n8n workflow
2. Check the HTTP Request node execution

### Step 2: Check Response
**Success Response:**
```json
{
  "success": true,
  "message": "Order added to queue",
  "orderId": "12345"
}
```

**Error Response (if still failing):**
```json
{
  "error": "Missing required fields",
  "missingFields": ["orderId"],
  "received": {
    "orderId": null,
    "orderNumber": "52149",
    "customerName": "John Doe",
    "customerEmail": "john@example.com"
  }
}
```

### Step 3: Check Webapp Console
1. Open `https://dilhan.ngrok.app/`
2. Open DevTools (F12) → Console
3. Look for logs:
   ```
   [receive-order POST] Received order data: {...}
   [receive-order POST] Order 12345 added to queue. Queue length: 1
   ```

---

## 🎯 Common Issues & Solutions

### Issue 1: "orderId is missing"
**Cause:** Your Salesforce mapping doesn't have `orderId` field

**Solution:** Add fallback to get it from Shopify:
```javascript
orderId: ={{ $('Map Shopify to Salesforce Fields').item.json.orderId || $json.id }}
```

---

### Issue 2: "customerName is missing"
**Cause:** Salesforce uses `Name` field, not `customerName`

**Solution:** Use the fallback:
```javascript
customerName: ={{ $('Map Shopify to Salesforce Fields').item.json.Name || $json.customerName }}
```

---

### Issue 3: "All fields are missing"
**Cause:** Wrong node reference in the expressions

**Solution:** Check your node name is exactly `Map Shopify to Salesforce Fields`
- If your node has a different name, update all references
- Example: If your node is called "Salesforce Mapping", change:
  ```javascript
  $('Map Shopify to Salesforce Fields').item.json.Name
  // to
  $('Salesforce Mapping').item.json.Name
  ```

---

## 📊 Required vs Optional Fields

### ✅ Required (Must Have Values)
- `orderId` - Unique order ID
- `orderNumber` - Order number for display
- `customerName` - Customer's name
- `customerEmail` - Customer's email

### ⚪ Optional (Can be "Not Provided")
- All health assessment fields (38 fields)
- `totalAmount`, `currency`, `shippingAddress`
- `orderDate` (has default fallback to current date)

---

## 🔍 Advanced Debugging

### Check What n8n is Sending

Add a **Set** node before your HTTP Request node:

1. Add a **Set** node
2. Set it to output:
   ```javascript
   {
     "orderId": "={{ $('Map Shopify to Salesforce Fields').item.json.orderId }}",
     "orderNumber": "={{ $('Map Shopify to Salesforce Fields').item.json.orderNumber }}",
     "customerName": "={{ $('Map Shopify to Salesforce Fields').item.json.Name }}",
     "customerEmail": "={{ $('Map Shopify to Salesforce Fields').item.json.customerEmail }}"
   }
   ```
3. Execute and check the output
4. This shows you exactly what values are available

---

## ✅ Checklist

- [ ] Updated HTTP Request node with fallback values for required fields
- [ ] Verified node name is correct (`Map Shopify to Salesforce Fields`)
- [ ] Tested workflow execution
- [ ] Checked HTTP Request node response (should be 200 OK)
- [ ] Checked webapp console logs (should see order received)
- [ ] Verified order appears in webapp within 3 seconds

---

## 🎉 Success Indicators

When everything works:
1. ✅ n8n HTTP Request returns `200 OK`
2. ✅ Response shows `"success": true`
3. ✅ Webapp console shows `[receive-order POST] Order 12345 added to queue`
4. ✅ Order appears in left panel within 3 seconds
5. ✅ Clicking order shows all health information

---

**If you're still having issues, check the n8n execution log and webapp console to see the exact error message!**

