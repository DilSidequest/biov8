# 🔄 Complete n8n Workflow Guide

## Overview

This guide shows you the complete workflow from receiving orders to generating prescription PDFs.

---

## 📊 Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PART 1: RECEIVE ORDERS                   │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│ 1. Shopify Node      │
│ Get orders by        │
│ customer ID          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 2. Code Node         │
│ Map Shopify orders   │
│ (See N8N_CODE_NODE.md)
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 3. HTTP Request      │
│ POST to webapp       │
│ /api/receive-order   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 4. Set Node          │
│ Store order data     │
│ for later use        │
└──────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              PART 2: RECEIVE PRESCRIPTION SUBMISSION        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│ 5. Webhook Node      │
│ Receive from webapp  │
│ URL: your-webhook    │
│ Gets: orderId,       │
│ doctorNotes,         │
│ signaturePdf         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 6. Get Order Data    │
│ Retrieve stored      │
│ order from Set node  │
│ Match by orderId     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 7. Code Node         │
│ Generate             │
│ Prescription HTML    │
│ (See below)          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 8. HTML to PDF       │
│ Convert HTML to PDF  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 9. Send Email        │
│ Email prescription   │
│ to customer          │
└──────────────────────┘
```

---

## 🔧 Node Configurations

### Node 1: Shopify - Get Orders

**Node Type**: Shopify

**Operation**: Get Orders

**Filters**: 
- By customer ID or email
- Status: Any

---

### Node 2: Code Node - Map Orders

**File**: `N8N_CODE_NODE.md`

**Purpose**: Transform Shopify orders to webapp format

**Key Points**:
- Handles wrapped format `[{ "orders": [...] }]`
- Maps all required fields
- Outputs one item per order

---

### Node 3: HTTP Request - Send to Webapp

**File**: `HTTP_NODE_CONFIG.md`

**Configuration**:
- Method: POST
- URL: `http://localhost:3000/api/receive-order`
- Body: All fields from Code node

---

### Node 4: Set Node - Store Order Data

**Purpose**: Store order data for later retrieval when prescription is submitted

**Configuration**:
- **Mode**: Manual Mapping
- **Keep Only Set**: No (keep all data)
- **Values to Set**:
  - `stored_order_{{ $json.orderId }}` = `{{ $json }}`

This stores the entire order object with a key based on orderId.

**Alternative**: Use a database node to store orders

---

### Node 5: Webhook - Receive Prescription Submission

**Node Type**: Webhook

**Configuration**:
- **HTTP Method**: POST
- **Path**: `/doctor-submission` (or your custom path)
- **Response Mode**: Last Node
- **Response Data**: Using 'Respond to Webhook' Node

**Webhook URL**: 
```
https://valerie-ai.app.n8n.cloud/webhook-test/2a69ecab-5192-4f30-ac17-cccc7f6ea15c
```

**Expected Data**:
```json
{
  "orderId": "6496063357177",
  "customerEmail": "patterson.alex@outlook.com",
  "doctorNotes": "Take medication as prescribed...",
  "signaturePdf": "JVBERi0xLjQK...",
  "submittedAt": "2025-11-15T10:30:00Z"
}
```

---

### Node 6: Get Order Data

**Option A: Using Set Node (Simple)**

If you stored data in Node 4 using Set node:

**Node Type**: Set

**Configuration**:
- Get the stored order using the orderId from webhook
- Expression: `{{ $('Set Node').item.json['stored_order_' + $json.orderId] }}`

**Option B: Using Function Node**

```javascript
// Get the orderId from webhook
const orderId = $input.first().json.orderId;

// Get the stored order from the Set node
const setNodeData = $('Set Node').all();

// Find the matching order
const orderData = setNodeData.find(item => 
  item.json.orderId === orderId
);

return [orderData];
```

**Option C: Using Database**

Query your database for the order by orderId.

---

### Node 7: Code Node - Generate Prescription HTML

**File**: `prescription-generator-code.js`

**Purpose**: Generate professional HTML prescription document

**Configuration**:
1. Copy code from `prescription-generator-code.js`
2. Paste into Code node
3. **IMPORTANT**: Change this line to match your node name:
   ```javascript
   const orderData = $('Get Order Data').first().json;
   ```
   Replace `'Get Order Data'` with your actual node name from Node 6

**Output**:
- `html`: Complete HTML prescription
- `fileName`: Suggested filename for PDF
- `orderId`, `orderNumber`, `customerEmail`: Metadata
- `signaturePdfBase64`: Original signature for other uses

---

### Node 8: HTML to PDF

**Node Type**: HTML to PDF (or Puppeteer)

**Configuration**:

**If using "HTML to PDF" node**:
- **HTML**: `={{ $json.html }}`
- **File Name**: `={{ $json.fileName }}`
- **Page Format**: A4
- **Margin**: 10mm (all sides)
- **Print Background**: Yes

**If using Puppeteer**:
```javascript
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent($json.html);
const pdf = await page.pdf({
  format: 'A4',
  margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
  printBackground: true
});
await browser.close();
return [{ binary: { data: pdf, mimeType: 'application/pdf' } }];
```

---

### Node 9: Send Email

**Node Type**: Send Email (Gmail, SendGrid, etc.)

**Configuration**:
- **To**: `={{ $('Webhook').first().json.customerEmail }}`
- **Subject**: `Your Prescription - Order #{{ $('Webhook').first().json.orderNumber }}`
- **Body**: 
  ```
  Dear {{ $('Get Order Data').first().json.customerName }},
  
  Please find attached your prescription for Order #{{ $('Webhook').first().json.orderNumber }}.
  
  If you have any questions, please contact us.
  
  Best regards,
  Doctor's Order Portal
  ```
- **Attachments**: 
  - File: From previous node (PDF)
  - Filename: `={{ $('Code Node').first().json.fileName }}`

---

## 🧪 Testing the Complete Workflow

### Test Part 1: Send Order to Webapp

1. Execute nodes 1-4
2. Check webapp at http://localhost:3000
3. Order should appear within 3 seconds

### Test Part 2: Submit Prescription

1. Fill out the form in the webapp
2. Upload signature PDF
3. Click Submit
4. Check n8n - webhook should trigger
5. Verify prescription PDF is generated
6. Check email inbox

---

## 💡 Pro Tips

### Tip 1: Error Handling

Add an **IF node** after each HTTP Request to check for errors:
```
{{ $json.success === true }}
```

### Tip 2: Logging

Add **Set nodes** throughout to log data at each step for debugging.

### Tip 3: Multiple Orders

The workflow handles multiple orders automatically. Each order becomes a separate execution.

### Tip 4: Signature Handling

If the embedded PDF signature doesn't render well in the final PDF:
1. Add a node to convert the signature PDF to PNG
2. Use the PNG in the HTML instead
3. Or use a service like CloudConvert

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `N8N_CODE_NODE.md` | Map Shopify orders (Node 2) |
| `HTTP_NODE_CONFIG.md` | Send to webapp (Node 3) |
| `prescription-generator-code.js` | Generate prescription HTML (Node 7) |
| `N8N_GENERATE_PRESCRIPTION.md` | Full documentation for Node 7 |
| `QUICK_START.md` | Quick reference guide |

---

## 🆘 Troubleshooting

### Orders not appearing in webapp
- Check HTTP Request response (should be 200)
- Verify webapp is running on port 3000
- Check browser console for errors

### Webhook not triggering
- Verify webhook URL in `.env.local`
- Check n8n webhook is active
- Test webhook with curl or Postman

### Prescription not generating
- Check Node 6 is returning order data
- Verify node name in Node 7 code matches Node 6
- Check console logs in n8n

### PDF not rendering correctly
- Try different HTML to PDF converter
- Simplify CSS if needed
- Convert signature to image first

---

**✅ You now have a complete workflow from order receipt to prescription generation!**

