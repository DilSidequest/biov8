# n8n HTTP Request Node Fix Guide

## 🔴 Issues Found in Your Current Node

### Issue 1: Extra Newline Characters
Your current node has `\n` at the end of these fields:
- `orderId`: `"={{ $json.orderId }}\n"` ❌
- `orderNumber`: `"={{ $json.orderNumber }}\n"` ❌
- `customerName`: `"={{ $json.customerName }}\n"` ❌
- `customerEmail`: `"={{ $json.customerEmail }}\n"` ❌

**Problem:** These newline characters will be included in the data, causing issues with validation and display.

**Fix:** Remove the `\n` from all fields.

---

### Issue 2: Missing Optional Fields
Your node is missing some fields that help with order display:
- `totalAmount` - Shows order value
- `currency` - Shows currency type
- `lineItems` - Shows what was ordered
- `shippingAddress` - Shows delivery address
- `tags` - Shows order tags

**Fix:** Add these fields with default values if not available.

---

## ✅ How to Fix Your n8n Node

### Option 1: Manual Update (Recommended)

1. **Open your n8n workflow**
2. **Click on the "Send to Doctor Dashboard" HTTP Request node**
3. **Update the Body Parameters:**

**Remove the `\n` from these fields:**
```
orderId: ={{ $json.orderId }}
orderNumber: ={{ $json.orderNumber }}
customerName: ={{ $json.customerName }}
customerEmail: ={{ $json.customerEmail }}
```

**Add these new fields:**
```
totalAmount: ={{ $json.totalAmount || '0.00' }}
currency: ={{ $json.currency || 'USD' }}
lineItems: ={{ $json.lineItems ? JSON.stringify($json.lineItems) : '' }}
shippingAddress: ={{ $json.shippingAddress ? JSON.stringify($json.shippingAddress) : '' }}
tags: ={{ $json.tags || '' }}
```

4. **Keep your existing custom fields:**
```
weightsatisfaction: ={{ $('Map Shopify to Salesforce Fields').item.json.WeightSatisfactionc }}
dietdescription: ={{ $('Map Shopify to Salesforce Fields').item.json.DietDescriptionc }}
```

5. **Save the workflow**

---

### Option 2: Import Corrected Node

1. **Copy the contents of `n8n-corrected-http-node.json`**
2. **In n8n, delete the old "Send to Doctor Dashboard" node**
3. **Paste the new node** (Ctrl+V or Cmd+V)
4. **Reconnect the node** to your workflow
5. **Update the custom field references** if your node names are different
6. **Save the workflow**

---

## 📋 Complete Field List

Here's what your node should send:

### Required Fields (Must Have)
- ✅ `orderId` - Unique order ID
- ✅ `orderNumber` - Order number for display
- ✅ `customerName` - Customer's full name
- ✅ `customerEmail` - Customer's email address
- ✅ `orderDate` - When the order was placed

### Optional Fields (Recommended)
- ✅ `totalAmount` - Order total (e.g., "150.00")
- ✅ `currency` - Currency code (e.g., "USD", "AUD")
- ✅ `lineItems` - JSON string of items ordered
- ✅ `shippingAddress` - JSON string of shipping address
- ✅ `tags` - Order tags (e.g., "prescription-required")

### Custom Fields (Your Specific Data)
- ✅ `weightsatisfaction` - Weight satisfaction data
- ✅ `dietdescription` - Diet description data

---

## 🧪 Test Your Updated Node

### Step 1: Send a Test Order
1. Execute your n8n workflow with test data
2. Check the execution log for the HTTP Request node
3. **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Order added to queue",
     "orderId": "your-order-id"
   }
   ```

### Step 2: Check Webapp Console
1. Open `https://dilhan.ngrok.app/`
2. Open DevTools (F12) → Console tab
3. **Expected Logs:**
   ```
   [receive-order POST] Received order data: {...}
   [receive-order POST] Order 123 added to queue. Queue length: 1
   [Polling] Found 1 new order(s), adding to store...
   [Polling] Adding order: 123 #52149
   ```

### Step 3: Verify in UI
1. Order should appear in left panel within 3 seconds
2. Click on the order
3. Form should open with customer data
4. All fields should be populated correctly

---

## 🔍 Before vs After

### Before (With Issues)
```json
{
  "orderId": "12345\n",           ❌ Has newline
  "orderNumber": "ORD-001\n",     ❌ Has newline
  "customerName": "John Doe\n",   ❌ Has newline
  "customerEmail": "john@example.com\n", ❌ Has newline
  "orderDate": "2025-11-20",
  "weightsatisfaction": "satisfied",
  "dietdescription": "keto"
  // Missing: totalAmount, currency, lineItems, etc.
}
```

### After (Fixed)
```json
{
  "orderId": "12345",             ✅ Clean
  "orderNumber": "ORD-001",       ✅ Clean
  "customerName": "John Doe",     ✅ Clean
  "customerEmail": "john@example.com", ✅ Clean
  "orderDate": "2025-11-20",
  "totalAmount": "150.00",        ✅ Added
  "currency": "USD",              ✅ Added
  "lineItems": "[...]",           ✅ Added
  "shippingAddress": "{...}",     ✅ Added
  "tags": "prescription-required", ✅ Added
  "weightsatisfaction": "satisfied",
  "dietdescription": "keto"
}
```

---

## ⚠️ Important Notes

1. **The `\n` characters are critical to remove** - They will cause display issues in the webapp
2. **totalAmount and currency are now optional** - The webapp will work without them, but they're recommended for better display
3. **Custom fields are preserved** - Your weightsatisfaction and dietdescription fields will still work
4. **The webapp now accepts any additional fields** - You can add more custom fields as needed

---

## 🎯 Quick Checklist

- [ ] Remove `\n` from orderId, orderNumber, customerName, customerEmail
- [ ] Add totalAmount field (or use default '0.00')
- [ ] Add currency field (or use default 'USD')
- [ ] Keep orderDate field
- [ ] Keep weightsatisfaction and dietdescription fields
- [ ] Optionally add lineItems, shippingAddress, tags
- [ ] Test the node by sending a test order
- [ ] Verify order appears in webapp within 3 seconds
- [ ] Verify clicking order opens form correctly

---

**✅ Once updated, your orders will flow smoothly from n8n to the webapp!**

