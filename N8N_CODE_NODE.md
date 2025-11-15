# n8n Code Node - Map Shopify Orders

## Overview

This Code node will transform Shopify orders from your API response into the format expected by the Doctor's Order Portal webapp.

---

## Code Node Configuration

### Node Settings

1. **Add a Code node** to your workflow
2. **Language**: JavaScript
3. **Mode**: Run Once for All Items

### Code

Copy and paste this code into your Code node:

```javascript
// Extract orders from the input data
// Handles both wrapped format [{ "orders": [...] }] and direct array format

const outputItems = [];

for (const item of $input.all()) {
  const data = item.json;
  
  // Check if data has an "orders" property (wrapped format)
  let orders = [];
  
  if (data.orders && Array.isArray(data.orders)) {
    // Wrapped format: [{ "orders": [...] }]
    orders = data.orders;
  } else if (Array.isArray(data)) {
    // Direct array format: [order1, order2, ...]
    orders = data;
  } else {
    // Single order object
    orders = [data];
  }
  
  // Map each order to the webapp format
  for (const order of orders) {
    const mappedOrder = {
      orderId: String(order.id),
      orderNumber: String(order.order_number),
      customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || order.billing_address?.name || 'Unknown Customer',
      customerEmail: order.email || order.contact_email || '',
      totalAmount: order.current_total_price || order.total_price || '0.00',
      currency: order.currency || 'AUD',
      orderDate: order.created_at || new Date().toISOString(),
      lineItems: JSON.stringify(order.line_items || []),
      shippingAddress: JSON.stringify(order.shipping_address || {}),
      tags: order.tags || ''
    };
    
    outputItems.push({
      json: mappedOrder
    });
  }
}

return outputItems;
```

---

## How It Works

### Input Handling

The code handles three different input formats:

1. **Wrapped Format** (like your output.json):
   ```json
   [{ "orders": [{ order1 }, { order2 }] }]
   ```

2. **Direct Array**:
   ```json
   [{ order1 }, { order2 }]
   ```

3. **Single Order**:
   ```json
   { order1 }
   ```

### Field Mapping

| Shopify Field | Webapp Field | Fallback |
|---------------|--------------|----------|
| `id` | `orderId` | - |
| `order_number` | `orderNumber` | - |
| `customer.first_name + last_name` | `customerName` | `billing_address.name` |
| `email` | `customerEmail` | `contact_email` |
| `current_total_price` | `totalAmount` | `total_price` |
| `currency` | `currency` | "AUD" |
| `created_at` | `orderDate` | Current timestamp |
| `line_items` | `lineItems` | Empty array |
| `shipping_address` | `shippingAddress` | Empty object |
| `tags` | `tags` | Empty string |

### Output

Each order becomes a separate item in n8n, ready to be sent to the webapp.

---

## Complete Workflow Setup

### Recommended Workflow Structure

```
┌─────────────────────────┐
│  1. Shopify Node        │
│  (Get Orders by         │
│   Customer ID)          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  2. Code Node           │
│  (Map Orders)           │
│  Use code above         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  3. HTTP Request Node   │
│  POST to webapp         │
│  /api/receive-order     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  4. Webhook Node        │
│  Wait for doctor        │
│  submission             │
└─────────────────────────┘
```

---

## HTTP Request Node Configuration (After Code Node)

After the Code node, configure your HTTP Request node:

**Method**: POST

**URL**: `http://localhost:3000/api/receive-order`

**Headers**:
- `Content-Type`: `application/json`

**Body**: 
- **Send As**: JSON
- **Specify Body**: Using Fields Below
- **Fields to Send**: All

The Code node output is already in the correct format, so you can just send all fields!

---

## Testing

### Test with Your output.json

1. Add a **Manual Trigger** or **Webhook** node
2. Add the **Code node** with the code above
3. Add an **HTTP Request node** configured as shown
4. Execute the workflow
5. Check your webapp at http://localhost:3000

The orders should appear in the left panel!

---

## Troubleshooting

### No orders appearing?

1. **Check Code node output**: Click on the Code node after execution to see the mapped data
2. **Verify HTTP Request**: Make sure it returns status 200
3. **Check webapp console**: Open browser DevTools and look for errors
4. **Verify webapp is running**: Make sure `pnpm dev` is running

### "Connection refused" error?

- Make sure the webapp is running on port 3000
- Check the URL in HTTP Request node is `http://localhost:3000/api/receive-order`
- If using n8n cloud, you'll need to expose your local webapp using ngrok or similar

### Orders not formatted correctly?

- Check the Code node output to see what data is being sent
- Verify the Shopify data structure matches what the code expects
- Add `console.log(order)` in the code to debug

---

## Alternative: Simple Loop Through Orders

If you prefer to process orders one at a time, use this simpler code:

```javascript
// Simple version - just extract orders array
const data = $input.first().json;

// Get orders array
let orders = [];
if (data.orders && Array.isArray(data.orders)) {
  orders = data.orders;
} else if (Array.isArray(data)) {
  orders = data;
} else {
  orders = [data];
}

// Return orders as separate items
return orders.map(order => ({ json: order }));
```

Then use the HTTP Request node with the original field mapping from N8N_CONFIGURATION.md.

---

## Pro Tips

1. **Use Split In Batches**: If you have many orders, add a "Split In Batches" node after the Code node to send orders in groups
2. **Add Error Handling**: Add an "IF" node after HTTP Request to check for errors
3. **Log Results**: Add a "Set" node to log successful submissions
4. **Rate Limiting**: Add a "Wait" node between batches to avoid overwhelming the webapp

---

## Need Help?

Check these files:
- `N8N_CONFIGURATION.md` - HTTP Request node details
- `README.md` - Webapp documentation
- `output.json` - Your sample Shopify data structure

