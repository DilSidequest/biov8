# n8n Configuration for Ngrok URL

## Overview
This guide explains how to configure your n8n HTTP Request nodes to send data to your webapp running on ngrok.

## Your Ngrok URL
```
https://dilhan.ngrok.app/
```

---

## HTTP Request Node Configurations

### 1. Sending Orders to Webapp

This node sends new orders from Shopify (or other sources) to your webapp.

**Node Configuration:**
- **Method**: POST
- **URL**: `https://dilhan.ngrok.app/api/receive-order`
- **Headers**:
  - Name: `Content-Type`
  - Value: `application/json`
- **Body**: 
  - Send As: JSON
  - Specify Body: Using Fields Below or JSON

**Required Fields in Body:**
```json
{
  "orderId": "6505200976121",
  "orderNumber": "52149",
  "customerName": "MaryAlice Morgan",
  "customerEmail": "customer@example.com",
  "totalAmount": "322.20",
  "currency": "AUD",
  "orderDate": "2025-10-30T14:31:03+11:00",
  "lineItems": "[...]",
  "shippingAddress": "{...}",
  "tags": "prescription-required"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order added to queue",
  "orderId": "6505200976121"
}
```

---

### 2. Receiving Prescription Submissions from Webapp

Your webapp sends completed prescription forms to n8n. This is already configured in your `.env.local` file:

**Webhook URL (in n8n):**
```
https://valerie-ai.app.n8n.cloud/webhook-test/2a69ecab-5192-4f30-ac17-cccc7f6ea15c
```

**Environment Variable (in webapp):**
```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://valerie-ai.app.n8n.cloud/webhook-test/2a69ecab-5192-4f30-ac17-cccc7f6ea15c
```

---

### 3. Customer Data Lookup (Optional)

If you're using the customer lookup feature, configure this webhook in n8n:

**Webhook Node in n8n:**
- **Method**: POST
- **Path**: `/fetch-customer`
- **Response Mode**: Respond Immediately

**Environment Variable (in webapp):**
```env
NEXT_PUBLIC_N8N_FETCH_CUSTOMER_WEBHOOK_URL=https://valerie-ai.app.n8n.cloud/webhook/fetch-customer
```

---

## Complete Workflow Example

### Shopify Order → Webapp

```
[Shopify Trigger]
    ↓
[Code Node] (optional - format data)
    ↓
[HTTP Request Node]
    Method: POST
    URL: https://dilhan.ngrok.app/api/receive-order
    Body: Order data (JSON)
    ↓
[Success/Error Handling]
```

### Webapp → n8n Prescription Processing

```
[Webhook Node] (receives from webapp)
    URL: https://valerie-ai.app.n8n.cloud/webhook-test/2a69ecab-5192-4f30-ac17-cccc7f6ea15c
    ↓
[Code Node] (process prescription data)
    ↓
[HTML Node] (generate prescription)
    ↓
[PDF Converter]
    ↓
[Email/Storage]
```

---

## Testing Your Configuration

### Test 1: Send Order to Webapp

Use n8n's "Execute Node" feature or send a test request:

```bash
curl -X POST https://dilhan.ngrok.app/api/receive-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-123",
    "orderNumber": "TEST-001",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "totalAmount": "150.00",
    "currency": "USD",
    "orderDate": "2025-11-20T10:30:00Z"
  }'
```

**Expected Result:**
- Order appears in webapp's left panel within 3 seconds
- Response: `{"success": true, "message": "Order added to queue", "orderId": "test-123"}`

### Test 2: Submit Prescription from Webapp

1. Open webapp: `https://dilhan.ngrok.app/`
2. Click on an order in the left panel
3. Enter customer email and fetch data
4. Fill out the prescription form
5. Submit the form

**Expected Result:**
- n8n webhook receives the prescription data
- Prescription is processed and PDF is generated
- Order is removed from webapp's pending list

---

## Troubleshooting

### Issue: Orders not appearing in webapp

**Check:**
1. Verify n8n HTTP Request URL is exactly: `https://dilhan.ngrok.app/api/receive-order`
2. Check that Content-Type header is set to `application/json`
3. Verify all required fields are included in the request body
4. Check n8n execution logs for errors

### Issue: Webapp can't submit to n8n

**Check:**
1. Verify `.env.local` has the correct webhook URL
2. Restart the webapp after changing environment variables
3. Check n8n webhook is active and listening
4. Check browser console for errors

### Issue: Ngrok URL changed

If your ngrok URL changes, update:
1. n8n HTTP Request node URL to new ngrok URL
2. No changes needed in webapp (it only receives, doesn't send to ngrok)

---

## Quick Reference

| Purpose | URL | Direction |
|---------|-----|-----------|
| Send orders to webapp | `https://dilhan.ngrok.app/api/receive-order` | n8n → Webapp |
| Send prescriptions to n8n | `https://valerie-ai.app.n8n.cloud/webhook-test/...` | Webapp → n8n |
| Fetch customer data | `https://valerie-ai.app.n8n.cloud/webhook/fetch-customer` | Webapp → n8n |

---

## Next Steps

1. ✅ Update n8n HTTP Request node URL to `https://dilhan.ngrok.app/api/receive-order`
2. ✅ Test sending an order from n8n
3. ✅ Verify order appears in webapp
4. ✅ Test completing a prescription in webapp
5. ✅ Verify n8n receives the prescription data

---

**🎉 Your webapp is now configured to work with ngrok!**

