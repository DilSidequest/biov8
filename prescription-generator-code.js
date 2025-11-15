// ============================================
// n8n Code Node: Generate Prescription HTML
// ============================================
// This code generates a professional prescription document
// with doctor's notes and signature from the webapp submission

// Get webhook data (from webapp submission)
const webhookData = $input.first().json;

// Extract submission data
const orderId = webhookData.orderId;
const customerEmail = webhookData.customerEmail;
const doctorNotes = webhookData.doctorNotes;
const signaturePdf = webhookData.signaturePdf; // base64 encoded PDF
const submittedAt = webhookData.submittedAt;

// Get order data from previous node (adjust node name as needed)
// If you stored the order data in a previous node, reference it here
const orderData = $('Get Order Data').first().json; // CHANGE THIS to your node name

// Parse line items if they're a JSON string
let lineItems = [];
try {
  lineItems = typeof orderData.lineItems === 'string' 
    ? JSON.parse(orderData.lineItems) 
    : orderData.lineItems || [];
} catch (e) {
  console.error('Error parsing line items:', e);
  lineItems = [];
}

// Parse shipping address if it's a JSON string
let shippingAddress = {};
try {
  shippingAddress = typeof orderData.shippingAddress === 'string'
    ? JSON.parse(orderData.shippingAddress)
    : orderData.shippingAddress || {};
} catch (e) {
  console.error('Error parsing shipping address:', e);
  shippingAddress = {};
}

// Format date
const prescriptionDate = new Date(submittedAt).toLocaleDateString('en-AU', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// Generate line items HTML table rows
const lineItemsHtml = lineItems.map((item, index) => `
  <tr>
    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name || item.title || 'N/A'}</td>
    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 1}</td>
    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${orderData.currency || 'AUD'} $${item.price || '0.00'}</td>
  </tr>
`).join('');

// Generate complete HTML prescription document
const prescriptionHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription - Order #${orderData.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #1f2937; background: white; padding: 40px; }
    .prescription-container { max-width: 800px; margin: 0 auto; background: white; border: 2px solid #2563eb; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .content { padding: 30px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; color: #2563eb; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .info-item { padding: 12px; background: #f9fafb; border-radius: 6px; }
    .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .info-value { font-size: 14px; color: #1f2937; font-weight: 500; }
    .medications-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .medications-table th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    .medications-table td { font-size: 14px; color: #1f2937; }
    .notes-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px; margin-top: 15px; }
    .notes-text { font-size: 14px; line-height: 1.8; color: #1f2937; white-space: pre-wrap; }
    .signature-section { margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb; }
    .signature-box { margin-top: 20px; text-align: center; }
    .signature-image { max-width: 400px; max-height: 150px; border: 1px solid #e5e7eb; padding: 15px; background: white; display: inline-block; }
    .signature-label { font-size: 12px; color: #6b7280; margin-top: 10px; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    @media print { body { padding: 0; } .prescription-container { border: none; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="prescription-container">
    <div class="header">
      <h1>PRESCRIPTION</h1>
      <p>Doctor's Order Portal - Order #${orderData.orderNumber}</p>
    </div>
    
    <div class="content">
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
      </div>
      
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
          <tbody>${lineItemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #1f2937;">Total Amount:</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #1f2937;">${orderData.currency || 'AUD'} $${orderData.totalAmount || '0.00'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">Doctor's Notes & Instructions</div>
        <div class="notes-box">
          <div class="notes-text">${doctorNotes}</div>
        </div>
      </div>
      
      <div class="signature-section">
        <div class="section-title">Doctor's Signature</div>
        <div class="signature-box">
          <div class="signature-image">
            <embed src="data:application/pdf;base64,${signaturePdf}" type="application/pdf" width="100%" height="120px" />
          </div>
          <div class="signature-label">Authorized Signature - ${prescriptionDate}</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an electronically generated prescription document.</p>
      <p>Order ID: ${orderId} | Generated: ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>
`;

// Return the HTML and metadata
return [{
  json: {
    html: prescriptionHtml,
    orderId: orderId,
    orderNumber: orderData.orderNumber,
    customerEmail: customerEmail,
    customerName: orderData.customerName,
    prescriptionDate: prescriptionDate,
    fileName: `Prescription_Order_${orderData.orderNumber}_${Date.now()}.pdf`,
    // Also return the binary signature for other uses
    signaturePdfBase64: signaturePdf
  }
}];

