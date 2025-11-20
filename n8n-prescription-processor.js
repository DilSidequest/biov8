// ============================================
// n8n Code Node: Process Medicines for Table
// ============================================
// This code ONLY processes the medicines array into HTML table rows
// All other webhook variables are passed through unchanged

// Get webhook data (from webapp submission)
const webhookData = $input.first().json;

// Extract lineItems and medicine data
const {
  lineItems,
  medicineName,
  medicineQuantity,
  medicineDescription,
  shippingAddress,
  clinicState,
  signaturePdf,
  submittedAt
} = webhookData;

// Parse line items if they're a JSON string
let parsedLineItems = [];
try {
  parsedLineItems = typeof lineItems === 'string'
    ? JSON.parse(lineItems)
    : lineItems || [];
} catch (e) {
  console.error('Error parsing line items:', e);
  parsedLineItems = [];
}

// Create medicines array from lineItems or from single medicine entry
let medicines = [];

// If lineItems exist, use them as medicines
if (parsedLineItems && parsedLineItems.length > 0) {
  medicines = parsedLineItems.map(item => ({
    name: item.name || item.title || '',
    quantity: item.quantity || '',
    description: item.variant_title || item.sku || ''
  }));
}

// If no lineItems but we have single medicine data, use that
if (medicines.length === 0 && medicineName) {
  medicines = [{
    name: medicineName,
    quantity: medicineQuantity || '',
    description: medicineDescription || ''
  }];
}

// Create exactly 3 medicine rows (fixed number for consistent spacing)
// Fill with actual data where available, leave blank otherwise
const MAX_MEDICINES = 3;
const medicinesTableRows = Array.from({ length: MAX_MEDICINES }, (_, index) => {
  const medicine = medicines[index] || { name: '', quantity: '', description: '' };
  return `
  <tr>
    <td>${medicine.name}</td>
    <td>${medicine.quantity}</td>
    <td>${medicine.description}</td>
  </tr>`;
}).join('');

// Parse shipping address if it's a JSON string
let parsedShippingAddress = {};
try {
  parsedShippingAddress = typeof shippingAddress === 'string'
    ? JSON.parse(shippingAddress)
    : shippingAddress || {};
} catch (e) {
  console.error('Error parsing shipping address:', e);
  parsedShippingAddress = {};
}

// Get patient state from shipping address
const patientState = parsedShippingAddress.province || parsedShippingAddress.state || clinicState || 'N/A';

// Format signature date
const formattedSignatureDate = new Date(submittedAt || Date.now()).toLocaleDateString('en-AU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

// Return ALL webhook data plus the processed medicines HTML
// This way the template can use the original webhook variable names
return [{
  json: {
    // Pass through ALL original webhook data
    ...webhookData,

    // Add processed variables
    medicinesTableRows: medicinesTableRows,  // HTML table rows for medicines
    patientState: patientState,              // Extracted from shippingAddress
    formattedSignatureDate: formattedSignatureDate  // Formatted date
  }
}];

