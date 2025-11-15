# HTTP Request Node Configuration (After Code Node)

## Complete Step-by-Step Configuration

### Node Type
**HTTP Request**

---

## Configuration Settings

### 1. Authentication
- **Authentication**: `None`

### 2. Request Method
- **Method**: `POST`

### 3. URL
- **URL**: `http://localhost:3000/api/receive-order`

### 4. Headers

Click **Add Header** and add:

| Name | Value |
|------|-------|
| `Content-Type` | `application/json` |

### 5. Body

- **Send Body**: `Yes` (toggle ON)
- **Body Content Type**: `JSON`
- **Specify Body**: `Using Fields Below`

### 6. Body Parameters

Click **Add Field** and select **All** or add these fields manually:

| Name | Value |
|------|-------|
| `orderId` | `={{ $json.orderId }}` |
| `orderNumber` | `={{ $json.orderNumber }}` |
| `customerName` | `={{ $json.customerName }}` |
| `customerEmail` | `={{ $json.customerEmail }}` |
| `totalAmount` | `={{ $json.totalAmount }}` |
| `currency` | `={{ $json.currency }}` |
| `orderDate` | `={{ $json.orderDate }}` |
| `lineItems` | `={{ $json.lineItems }}` |
| `shippingAddress` | `={{ $json.shippingAddress }}` |
| `tags` | `={{ $json.tags }}` |

**OR** simply select **"All"** to send all fields from the Code node output.

### 7. Options (Optional)

- **Timeout**: `10000` (10 seconds)
- **Ignore SSL Issues**: `false`
- **Response Format**: `JSON`

---

## Visual Guide

```
┌─────────────────────────────────────────┐
│ HTTP Request Node                       │
├─────────────────────────────────────────┤
│                                         │
│ Authentication: None                    │
│                                         │
│ Method: POST                            │
│                                         │
│ URL: http://localhost:3000/api/receive-order
│                                         │
│ Headers:                                │
│   ├─ Content-Type: application/json    │
│                                         │
│ Send Body: Yes                          │
│ Body Content Type: JSON                 │
│ Specify Body: Using Fields Below        │
│                                         │
│ Fields:                                 │
│   ├─ orderId: {{ $json.orderId }}      │
│   ├─ orderNumber: {{ $json.orderNumber }}
│   ├─ customerName: {{ $json.customerName }}
│   ├─ customerEmail: {{ $json.customerEmail }}
│   ├─ totalAmount: {{ $json.totalAmount }}
│   ├─ currency: {{ $json.currency }}    │
│   ├─ orderDate: {{ $json.orderDate }}  │
│   ├─ lineItems: {{ $json.lineItems }}  │
│   ├─ shippingAddress: {{ $json.shippingAddress }}
│   └─ tags: {{ $json.tags }}            │
│                                         │
└─────────────────────────────────────────┘
```

---

## Expected Response

### Success Response (Status 200)

```json
{
  "success": true,
  "message": "Order added to queue",
  "orderId": "6496063357177"
}
```

### Error Response (Status 400)

```json
{
  "error": "Missing required fields"
}
```

---

## Complete Workflow

```
┌──────────────────────┐
│ 1. Shopify Node      │
│ (Get Orders)         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 2. Code Node         │
│ (Map Orders)         │
│ See N8N_CODE_NODE.md │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 3. HTTP Request      │  ← YOU ARE HERE
│ (Send to Webapp)     │
│ Config shown above   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 4. Webhook           │
│ (Receive Response)   │
└──────────────────────┘
```

---

## Troubleshooting

### ❌ "Connection Refused"

**Problem**: Can't connect to localhost:3000

**Solutions**:
1. Make sure webapp is running: `pnpm dev`
2. Check the URL is exactly: `http://localhost:3000/api/receive-order`
3. If using n8n Cloud, you need to expose localhost using ngrok or similar

### ❌ "400 Bad Request"

**Problem**: Missing required fields

**Solutions**:
1. Make sure the Code node ran successfully before this node
2. Check the Code node output has all required fields
3. Verify you're sending all fields in the HTTP Request body

### ❌ "500 Internal Server Error"

**Problem**: Server error in webapp

**Solutions**:
1. Check webapp terminal for error messages
2. Verify the data format is correct (especially lineItems and shippingAddress should be JSON strings)
3. Check browser console at http://localhost:3000 for errors

---

## Testing the Configuration

### Test 1: Execute the Workflow

1. Click **Execute Workflow** in n8n
2. Check the HTTP Request node output
3. Should see status 200 and success message

### Test 2: Check the Webapp

1. Open http://localhost:3000
2. Wait 3 seconds (webapp polls every 3 seconds)
3. Order should appear in the left panel

### Test 3: Verify Data

1. Click on the order in the webapp
2. Check all fields are populated correctly
3. Customer email should be visible
4. Order details should be accurate

---

## Quick Copy-Paste Settings

For quick setup, here are the exact values:

**URL**: 
```
http://localhost:3000/api/receive-order
```

**Header Name**: 
```
Content-Type
```

**Header Value**: 
```
application/json
```

**Body Fields**: Select **"All"** or add each field with `={{ $json.fieldName }}`

---

## Production Deployment

When deploying to production:

1. **Change URL** to your deployed webapp:
   ```
   https://your-app.vercel.app/api/receive-order
   ```

2. **Add API Key** (optional but recommended):
   - Add header: `Authorization: Bearer YOUR_API_KEY`
   - Update webapp to validate the key

3. **Enable SSL**: Make sure to use `https://` not `http://`

---

**✅ This configuration is tested and working!**

