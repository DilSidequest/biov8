# Customer Lookup Setup Guide

## Overview
This guide explains the new two-step workflow where doctors first enter a customer email to fetch their information from n8n, then fill out the prescription form.

## Workflow Changes

### Old Workflow
1. n8n sends order data to webapp via webhook
2. Webapp displays order in left panel
3. Doctor clicks order and fills form
4. Form is submitted back to n8n

### New Workflow
1. Doctor enters customer email in webapp
2. Webapp sends email to n8n webhook to fetch customer info
3. n8n returns customer information (order details, etc.)
4. Webapp displays customer info + form fields
5. Doctor fills form and submits
6. Form is submitted to n8n for prescription generation

## Environment Variables

Add this new environment variable to your `.env.local` file:

```env
# Existing webhook for prescription submission
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://valerie-ai.app.n8n.cloud/webhook-test/2a69ecab-5192-4f30-ac17-cccc7f6ea15c

# NEW: Webhook for customer data fetching
NEXT_PUBLIC_N8N_FETCH_CUSTOMER_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/fetch-customer
```

## n8n Workflow Setup

### Step 1: Create Customer Lookup Webhook

Create a new n8n workflow with the following nodes:

#### 1. Webhook Node (Trigger)
```
Type: Webhook
Method: POST
Path: /fetch-customer
Response Mode: Respond Immediately
Response Code: 200
```

**Expected Input:**
```json
{
  "email": "customer@example.com"
}
```

#### 2. Lookup Customer Data Node
This node should query your database/system to find customer information based on the email.

Example using HTTP Request to Shopify:
```
Method: GET
URL: https://your-store.myshopify.com/admin/api/2024-01/customers/search.json?query=email:{{ $json.email }}
Authentication: API Key
Headers:
  X-Shopify-Access-Token: your_access_token
```

#### 3. Code Node - Format Response
```javascript
// Get customer data from previous node
const customers = $input.first().json.customers;

if (!customers || customers.length === 0) {
  return [{
    json: {
      error: 'Customer not found',
      success: false
    }
  }];
}

const customer = customers[0];
const lastOrder = customer.last_order || {};

// Format response to match Order interface
return [{
  json: {
    orderId: lastOrder.id?.toString() || 'N/A',
    orderNumber: lastOrder.order_number?.toString() || 'N/A',
    customerName: `${customer.first_name} ${customer.last_name}`,
    customerEmail: customer.email,
    totalAmount: lastOrder.total_price || '0.00',
    currency: lastOrder.currency || 'USD',
    orderDate: lastOrder.created_at || new Date().toISOString(),
    lineItems: JSON.stringify(lastOrder.line_items || []),
    shippingAddress: JSON.stringify(lastOrder.shipping_address || {}),
    tags: customer.tags || ''
  }
}];
```

#### 4. Respond to Webhook Node
```
Response Mode: Using 'Respond to Webhook' Node
Response Data: {{ $json }}
```

### Step 2: Update Webhook URL

Copy the webhook URL from your n8n workflow and add it to your `.env.local` file:

```env
NEXT_PUBLIC_N8N_FETCH_CUSTOMER_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/fetch-customer
```

### Step 3: Test the Workflow

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Open the webapp in your browser

3. Enter a customer email in the lookup form

4. Verify that customer data is fetched and displayed

5. Fill out the prescription form and submit

## API Endpoints

### POST `/api/fetch-customer`
Fetches customer information from n8n based on email.

**Request:**
```json
{
  "email": "customer@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "customerData": {
    "orderId": "6505200976121",
    "orderNumber": "1234",
    "customerName": "John Doe",
    "customerEmail": "customer@example.com",
    "totalAmount": "99.99",
    "currency": "USD",
    "orderDate": "2025-11-19T10:00:00.000Z",
    "lineItems": "[...]",
    "shippingAddress": "{...}",
    "tags": "prescription-required"
  }
}
```

**Response (Error):**
```json
{
  "error": "Customer not found"
}
```

## Troubleshooting

### Customer Not Found
- Verify the email is correct
- Check that the customer exists in your system
- Review n8n workflow logs for errors

### Webhook Timeout
- Check n8n workflow is active
- Verify webhook URL is correct
- Ensure n8n can access your data source

### Invalid Response Format
- Verify the Code Node in n8n returns data matching the Order interface
- Check browser console for detailed error messages

