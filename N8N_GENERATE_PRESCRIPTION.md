# n8n Code Node - Generate Prescription Document

## Overview

This Code node generates a professional HTML prescription document using the doctor's notes and signature PDF from the webapp submission.

---

## Workflow Position

```
┌──────────────────────┐
│ 1. Webhook           │
│ (Receive from webapp)│
│ Gets: orderId,       │
│ doctorNotes,         │
│ signaturePdf         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 2. Get Order Data    │
│ (Fetch original      │
│  order details)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 3. Code Node         │  ← YOU ARE HERE
│ (Generate            │
│  Prescription HTML)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 4. HTML to PDF       │
│ (Convert to PDF)     │
└──────────────────────┘
```

---

## Code Node Configuration

### Node Settings

1. **Add a Code node** to your workflow
2. **Language**: JavaScript
3. **Mode**: Run Once for All Items

### Code

Copy and paste this code into your Code node:

```javascript
// Generate Prescription HTML Document
// This code creates a professional prescription with doctor's notes and signature

// Get webhook data (from webapp submission)
const webhookData = $input.first().json;

// Extract data
const orderId = webhookData.orderId;
const customerEmail = webhookData.customerEmail;
const doctorNotes = webhookData.doctorNotes;
const signaturePdf = webhookData.signaturePdf; // base64 encoded PDF
const submittedAt = webhookData.submittedAt;

// Get order data (you'll need to fetch this from your database or previous node)
// For now, we'll use the data from a previous node or merge node
const orderData = $('Get Order Data').first().json; // Adjust node name as needed

// Parse line items if they're a string
let lineItems = [];
try {
  lineItems = typeof orderData.lineItems === 'string' 
    ? JSON.parse(orderData.lineItems) 
    : orderData.lineItems || [];
} catch (e) {
  lineItems = [];
}

// Parse shipping address if it's a string
let shippingAddress = {};
try {
  shippingAddress = typeof orderData.shippingAddress === 'string'
    ? JSON.parse(orderData.shippingAddress)
    : orderData.shippingAddress || {};
} catch (e) {
  shippingAddress = {};
}

// Format date
const prescriptionDate = new Date(submittedAt).toLocaleDateString('en-AU', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// Generate line items HTML
const lineItemsHtml = lineItems.map((item, index) => `
  <tr>
    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name || item.title || 'N/A'}</td>
    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 1}</td>
    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${orderData.currency || 'AUD'} $${item.price || '0.00'}</td>
  </tr>
`).join('');

// Generate HTML prescription
const prescriptionHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription - Order #${orderData.orderNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
      padding: 40px;
    }
    
    .prescription-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 2px solid #2563eb;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .content {
      padding: 30px;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .info-item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }
    
    .info-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 500;
    }

    .medications-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }

    .medications-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }

    .medications-table td {
      font-size: 14px;
      color: #1f2937;
    }

    .notes-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      border-radius: 6px;
      margin-top: 15px;
    }

    .notes-text {
      font-size: 14px;
      line-height: 1.8;
      color: #1f2937;
      white-space: pre-wrap;
    }

    .signature-section {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
    }

    .signature-box {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 20px;
    }

    .signature-image {
      max-width: 300px;
      max-height: 100px;
      border: 1px solid #e5e7eb;
      padding: 10px;
      background: white;
    }

    .signature-line {
      flex: 1;
      margin-left: 40px;
    }

    .signature-line-border {
      border-bottom: 2px solid #1f2937;
      margin-bottom: 8px;
    }

    .signature-label {
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }

    .footer {
      background: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }

    @media print {
      body {
        padding: 0;
      }
      .prescription-container {
        border: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="prescription-container">
    <!-- Header -->
    <div class="header">
      <h1>PRESCRIPTION</h1>
      <p>Doctor's Order Portal - Order #${orderData.orderNumber}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Patient Information -->
      <div class="section">
        <div class="section-title">Patient Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Patient Name</div>
            <div class="info-value">${orderData.customerName || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${customerEmail}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Order Number</div>
            <div class="info-value">#${orderData.orderNumber}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Prescription Date</div>
            <div class="info-value">${prescriptionDate}</div>
          </div>
        </div>

        ${shippingAddress.address1 ? `
        <div class="info-item" style="grid-column: 1 / -1;">
          <div class="info-label">Shipping Address</div>
          <div class="info-value">
            ${shippingAddress.address1 || ''}<br>
            ${shippingAddress.city || ''}, ${shippingAddress.province || ''} ${shippingAddress.zip || ''}<br>
            ${shippingAddress.country || ''}
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Prescribed Medications/Items -->
      <div class="section">
        <div class="section-title">Prescribed Medications / Items</div>
        <table class="medications-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Item Name</th>
              <th style="width: 100px; text-align: center;">Quantity</th>
              <th style="width: 120px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #1f2937;">Total Amount:</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #1f2937;">${orderData.currency || 'AUD'} $${orderData.totalAmount || '0.00'}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Doctor's Notes -->
      <div class="section">
        <div class="section-title">Doctor's Notes & Instructions</div>
        <div class="notes-box">
          <div class="notes-text">${doctorNotes}</div>
        </div>
      </div>

      <!-- Signature -->
      <div class="signature-section">
        <div class="section-title">Doctor's Signature</div>
        <div class="signature-box">
          <div>
            <embed src="data:application/pdf;base64,${signaturePdf}"
                   type="application/pdf"
                   class="signature-image" />
          </div>
          <div class="signature-line">
            <div class="signature-line-border"></div>
            <div class="signature-label">Authorized Signature</div>
          </div>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
          This prescription was electronically signed on ${prescriptionDate}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This is an electronically generated prescription document.</p>
      <p>Order ID: ${orderId} | Generated: ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>
`;

// Return the HTML
return [{
  json: {
    html: prescriptionHtml,
    orderId: orderId,
    orderNumber: orderData.orderNumber,
    customerEmail: customerEmail,
    prescriptionDate: prescriptionDate,
    fileName: `Prescription_${orderData.orderNumber}_${Date.now()}.pdf`
  }
}];
```

---

## Important Notes

### 1. Order Data Source

The code assumes you have order data from a previous node. You need to either:

**Option A**: Store order data when it's first received and retrieve it
**Option B**: Pass order data through the workflow
**Option C**: Merge the webhook data with stored order data

Adjust this line to match your workflow:
```javascript
const orderData = $('Get Order Data').first().json; // Change 'Get Order Data' to your node name
```

### 2. Signature PDF Handling

The signature is embedded as a base64 PDF. In the HTML, it uses:
```html
<embed src="data:application/pdf;base64,${signaturePdf}" />
```

When converting to PDF, some converters might not support embedded PDFs. You may need to:
- Convert the signature PDF to an image first
- Or extract the first page as an image
- Or use a different embedding method

---

## Next Steps After This Node

### Option 1: Use HTML to PDF Node (Recommended)

Add an **HTML to PDF** node after this Code node:

1. **HTML Content**: `={{ $json.html }}`
2. **File Name**: `={{ $json.fileName }}`
3. **Page Size**: A4
4. **Margin**: 10mm all sides

### Option 2: Use Puppeteer or Similar

If you need more control, use a Puppeteer node to convert HTML to PDF with custom options.

---

## Complete Workflow Example

```
┌─────────────────────────┐
│ 1. Webhook              │
│ (Receive submission)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. Set Node             │
│ (Store webhook data)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. Get Order Data       │
│ (Fetch from database    │
│  or previous storage)   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. Code Node            │  ← THIS NODE
│ (Generate HTML)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 5. HTML to PDF          │
│ (Convert to PDF)        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 6. Send Email           │
│ (Email prescription     │
│  to customer)           │
└─────────────────────────┘
```

---

## Testing

### Test Data

Use this test data structure:

```javascript
// Webhook data
{
  "orderId": "6496063357177",
  "customerEmail": "patterson.alex@outlook.com",
  "doctorNotes": "Take medication as prescribed. Follow up in 2 weeks.",
  "signaturePdf": "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL...",
  "submittedAt": "2025-11-15T10:30:00Z"
}

// Order data
{
  "orderNumber": "51962",
  "customerName": "Alex Patterson",
  "totalAmount": "1387.00",
  "currency": "AUD",
  "lineItems": [...],
  "shippingAddress": {...}
}
```

---

## Customization

### Change Colors

Edit the CSS in the code:
- Header gradient: `#2563eb` to `#1d4ed8`
- Section titles: `#2563eb`
- Notes box: `#fef3c7` background, `#f59e0b` border

### Add Logo

Add this in the header section:
```html
<img src="YOUR_LOGO_URL" alt="Logo" style="max-width: 150px; margin-bottom: 15px;">
```

### Change Layout

Modify the HTML structure and CSS to match your branding.

---

## Troubleshooting

### Signature Not Showing

- Check if `signaturePdf` is valid base64
- Try converting PDF to image first
- Use `<img>` tag instead of `<embed>`

### Missing Order Data

- Verify the previous node name in the code
- Check that order data is being passed correctly
- Add console.log to debug: `console.log(orderData)`

### HTML to PDF Issues

- Some converters don't support all CSS
- Test with different PDF converters
- Simplify CSS if needed

---

**✅ This code generates a professional prescription document with all order details, doctor's notes, and signature!**

