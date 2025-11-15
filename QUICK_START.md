# 🚀 Quick Start Guide - Doctor's Order Portal

## ✅ Your Webapp is Working!

I just tested it and confirmed the webapp is receiving orders successfully!

**Test Result**: ✅ Status 200 - Order added to queue

---

## 📋 What You Need to Do in n8n

### Option 1: Use Code Node (RECOMMENDED)

This is the easiest way to handle multiple Shopify orders.

#### Step 1: Add a Code Node

Add a **Code node** after your Shopify node and paste this code:

```javascript
// Extract and map Shopify orders to webapp format
const outputItems = [];

for (const item of $input.all()) {
  const data = item.json;
  
  // Handle wrapped format [{ "orders": [...] }]
  let orders = [];
  if (data.orders && Array.isArray(data.orders)) {
    orders = data.orders;
  } else if (Array.isArray(data)) {
    orders = data;
  } else {
    orders = [data];
  }
  
  // Map each order
  for (const order of orders) {
    outputItems.push({
      json: {
        orderId: String(order.id),
        orderNumber: String(order.order_number),
        customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || order.billing_address?.name || 'Unknown',
        customerEmail: order.email || order.contact_email || '',
        totalAmount: order.current_total_price || order.total_price || '0.00',
        currency: order.currency || 'AUD',
        orderDate: order.created_at || new Date().toISOString(),
        lineItems: JSON.stringify(order.line_items || []),
        shippingAddress: JSON.stringify(order.shipping_address || {}),
        tags: order.tags || ''
      }
    });
  }
}

return outputItems;
```

#### Step 2: Add HTTP Request Node

After the Code node, add an **HTTP Request node**:

- **Method**: POST
- **URL**: `http://localhost:3000/api/receive-order`
- **Headers**: 
  - Name: `Content-Type`
  - Value: `application/json`
- **Body**: 
  - Send As: JSON
  - Specify Body: Using Fields Below
  - Fields to Send: All

**That's it!** The Code node already formatted everything correctly.

---

### Option 2: Direct Mapping (Without Code Node)

If you're processing single orders directly from Shopify:

#### HTTP Request Node Configuration

- **Method**: POST
- **URL**: `http://localhost:3000/api/receive-order`
- **Headers**: 
  - Name: `Content-Type`
  - Value: `application/json`
- **Body**: Send As JSON

**JSON Body**:
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

---

## 🧪 Testing

### Test 1: Check Webapp is Running

Open your browser: http://localhost:3000

You should see the dark-themed Doctor's Order Portal.

### Test 2: Send a Test Order

I've already sent a test order for you! Check the webapp - you should see:

**Order #51962**
- Customer: Alex Patterson
- Amount: AUD $1387.00
- Date: Oct 24, 2025

### Test 3: Send from n8n

1. Set up your n8n workflow with the Code node (Option 1)
2. Execute the workflow
3. Within 3 seconds, the order will appear in the webapp
4. Click on the order to fill out the prescription form

---

## 🔍 Troubleshooting

### "Connection Refused" Error

**Solution**: Make sure the webapp is running
```bash
pnpm dev
```

The webapp should be running on http://localhost:3000

### Orders Not Appearing

1. **Check HTTP Request Response**: Should return status 200
2. **Check Browser Console**: Open DevTools (F12) and look for errors
3. **Wait 3 seconds**: The webapp polls every 3 seconds for new orders
4. **Check localStorage**: Open DevTools > Application > Local Storage > http://localhost:3000

### Wrong Data Format

- Make sure you're using the Code node to map Shopify orders
- Check the Code node output to see what's being sent
- Verify all required fields are present: orderId, orderNumber, customerName, customerEmail, totalAmount, currency, orderDate

---

## 📁 Files Created for You

| File | Purpose |
|------|---------|
| `N8N_CODE_NODE.md` | Complete guide for the Code node approach |
| `N8N_CONFIGURATION.md` | HTTP Request node configuration details |
| `test-order.json` | Sample test order (already tested successfully!) |
| `QUICK_START.md` | This file - quick reference |
| `SETUP_COMPLETE.md` | Full setup documentation |

---

## 🎯 Next Steps

1. ✅ Webapp is running on http://localhost:3000
2. ✅ Test order was sent successfully
3. ⏭️ Set up your n8n workflow with the Code node
4. ⏭️ Test sending orders from n8n
5. ⏭️ Fill out a prescription form in the webapp
6. ⏭️ Verify the completed form is sent back to n8n webhook

---

## 💡 Pro Tips

- **Multiple Orders**: The Code node handles multiple orders automatically
- **Error Handling**: Add an IF node after HTTP Request to check for errors
- **Polling**: The webapp checks for new orders every 3 seconds
- **Persistence**: Orders are saved in localStorage, so they won't be lost on refresh
- **Dark Theme**: The webapp has a professional dark theme with centered text

---

## 🆘 Need More Help?

Check these detailed guides:
- `N8N_CODE_NODE.md` - Full Code node documentation with examples
- `N8N_CONFIGURATION.md` - Detailed HTTP Request configuration
- `README.md` - Complete webapp documentation

---

**🎊 Everything is working! Your webapp is ready to receive orders from n8n!**

