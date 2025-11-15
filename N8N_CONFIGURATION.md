# n8n HTTP Request Node Configuration

## Sending Shopify Orders to the Webapp

This guide shows you how to configure the n8n HTTP Request node to send Shopify orders from your workflow to the Doctor's Order Portal webapp.

---

## HTTP Request Node Settings

### Basic Configuration

1. **Method**: `POST`
2. **URL**:
   - **Development**: `http://localhost:3000/api/receive-order`
   - **Production**: `https://your-deployed-app.vercel.app/api/receive-order`

### Authentication

- **Authentication**: None

### Headers

Add the following header:

| Name | Value |
|------|-------|
| `Content-Type` | `application/json` |

### Body Configuration

**Send As**: JSON

**JSON Body for Shopify Orders**:

```json
{
  "orderId": "={{ $json.id }}",
  "orderNumber": "={{ $json.order_number }}",
  "customerName": "={{ $json.customer.first_name }} {{ $json.customer.last_name }}",
  "customerEmail": "={{ $json.email }}",
  "totalAmount": "={{ $json.current_total_price }}",
  "currency": "={{ $json.currency }}",
  "orderDate": "={{ $json.created_at }}",
  "lineItems": "={{ JSON.stringify($json.line_items) }}",
  "shippingAddress": "={{ JSON.stringify($json.shipping_address) }}",
  "tags": "={{ $json.tags }}"
}
```

### Important Notes:
- ✅ Use `$json.email` (not `$json.customer.email`) for the customer email
- ✅ Use `$json.current_total_price` (not `$json.total_price`) for the amount
- ✅ Make sure your webapp is running on port **3000**
- ⚠️ If you get "connection refused", the webapp might not be running - check with `pnpm dev`

---

## Field Mapping Explanation

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| `orderId` | Unique order identifier | ✅ Yes | "6505200976121" |
| `orderNumber` | Human-readable order number | ✅ Yes | "52149" |
| `customerName` | Full name of customer | ✅ Yes | "MaryAlice Morgan" |
| `customerEmail` | Customer's email address | ✅ Yes | "customer@example.com" |
| `totalAmount` | Order total amount | ✅ Yes | "322.20" |
| `currency` | Currency code | ✅ Yes | "AUD" |
| `orderDate` | ISO date string | ✅ Yes | "2025-10-30T14:31:03+11:00" |
| `lineItems` | JSON string of items | ❌ No | "[{...}]" |
| `shippingAddress` | JSON string of address | ❌ No | "{...}" |
| `tags` | Order tags | ❌ No | "prescription,urgent" |

---

## Example Workflow Setup

### Step 1: Trigger (e.g., Shopify Order Created)
Your workflow starts when a new order is created in Shopify or another system.

### Step 2: HTTP Request Node
Configure the HTTP Request node as described above to send the order to the webapp.

### Step 3: Webhook Node (Wait for Doctor Submission)
Set up a webhook to receive the completed prescription form back from the webapp.

**Webhook Configuration**:
- **Path**: `doctor-submission` (or any custom path)
- **Method**: POST
- **Response Mode**: Respond when workflow finishes

The webhook URL will be: `https://valerie-ai.app.n8n.cloud/webhook-test/2a69ecab-5192-4f30-ac17-cccc7f6ea15c`

---

## Testing the Configuration

### Test with Sample Data

You can test the HTTP Request node with this sample payload:

```json
{
  "orderId": "test-123456",
  "orderNumber": "TEST-001",
  "customerName": "John Doe",
  "customerEmail": "john.doe@example.com",
  "totalAmount": "150.00",
  "currency": "USD",
  "orderDate": "2025-11-15T10:30:00Z",
  "lineItems": "[{\"name\":\"Product A\",\"quantity\":2}]",
  "shippingAddress": "{\"city\":\"New York\",\"country\":\"USA\"}",
  "tags": "test,prescription"
}
```

### Expected Response

**Success Response** (Status 200):
```json
{
  "success": true,
  "message": "Order added to queue",
  "orderId": "test-123456"
}
```

**Error Response** (Status 400):
```json
{
  "error": "Missing required fields"
}
```

---

## Troubleshooting

### Order not appearing in webapp?

1. **Check the URL**: Ensure you're using the correct endpoint (`/api/receive-order`)
2. **Verify payload**: Make sure all required fields are present
3. **Check network**: Ensure n8n can reach your webapp (firewall, CORS)
4. **View logs**: Check n8n execution logs for errors

### Getting 400 Bad Request?

- Verify all required fields are included in the payload
- Check that email format is valid
- Ensure JSON is properly formatted

### Getting 500 Internal Server Error?

- Check webapp logs for errors
- Verify the webapp is running
- Check if there are any server-side issues

---

## Complete n8n Workflow Example

```
┌─────────────────────────┐
│  Shopify Trigger        │
│  (Order Created)        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  HTTP Request Node      │
│  POST to webapp         │
│  /api/receive-order     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Webhook Node           │
│  Wait for doctor        │
│  submission             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Process Prescription   │
│  (Your custom logic)    │
└─────────────────────────┘
```

---

## Additional Notes

- The webapp polls for new orders every 3 seconds
- Orders are stored in the browser's localStorage for persistence
- The webapp will automatically display new orders in the left panel
- Doctors can then select and process orders from the interface

---

## Support

If you encounter any issues:
1. Check the webapp is running (`pnpm dev` for development)
2. Verify environment variables are set correctly
3. Check browser console for JavaScript errors
4. Review n8n execution logs for HTTP request errors

