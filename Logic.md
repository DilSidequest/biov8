# Doctor's Prescription Form - Logic Flow

## Overall Flow Diagram
```
n8n (Shopify Order) 
    ↓
    POST /api/orders
    ↓
Webapp receives & stores order
    ↓
Display in left panel (Pending Orders)
    ↓
Doctor clicks order card
    ↓
Display order details in right panel
    ↓
Doctor fills:
  - Customer Email (auto-filled)
  - Doctor's Notes
  - Upload Signature PDF
    ↓
Doctor clicks Submit
    ↓
Validate form
    ↓
POST to /api/submit
    ↓
Send to n8n webhook
    ↓
n8n receives submission
    ↓
n8n generates prescription
    ↓
Remove order from pending list
    ↓
Show success message
```

---

## Detailed Logic

### 1. Receiving Orders from n8n

**Trigger:** n8n sends HTTP POST to `/api/orders`

**Logic:**
```typescript
// app/api/orders/route.ts

1. Receive POST request with order data
2. Validate request:
   - Check if orderId exists
   - Check if customerEmail is valid
   - Verify required fields are present
3. Check if order already exists in queue
   - If exists: Update order
   - If new: Add to queue
4. Store order in application state/database
5. Return success response
```

**Validation Rules:**
- `orderId`: Required, string
- `customerEmail`: Required, valid email format
- `orderNumber`: Required
- `customerName`: Required
- `totalAmount`: Required, number

**Error Handling:**
- Missing required fields → 400 Bad Request
- Duplicate order → Update existing
- Database error → 500 Internal Server Error

---

### 2. Displaying Pending Orders (Left Panel)

**Trigger:** Component mount / State update

**Logic:**
```typescript
// components/OrderList.tsx

1. Fetch pending orders from state
2. Sort orders by date (newest first)
3. Map orders to OrderCard components
4. Display each card with:
   - Order number
   - Customer name (first + last)
   - Total amount with currency
   - Order date (formatted)
   - Visual indicator (pending badge)
5. Add click handler to each card
6. Highlight selected order
```

**Display Rules:**
- Show max 50 orders at once
- Scroll if more than 10 orders
- Highlight selected order with border/background
- Show badge count of pending orders

---

### 3. Selecting an Order

**Trigger:** User clicks on order card

**Logic:**
```typescript
// page.tsx

1. User clicks order card
2. Set selectedOrder in state
3. Populate right panel with order data:
   - Auto-fill customer email
   - Clear previous doctor notes
   - Clear previous signature upload
4. Scroll right panel into view (mobile)
5. Focus on doctor's notes textarea
```

**State Update:**
```typescript
selectedOrder = clickedOrder
formData = {
  customerEmail: selectedOrder.customerEmail,
  doctorNotes: '',
  signaturePdf: null
}
```

---

### 4. Form Field Management

**Trigger:** User interaction with form fields

**Logic:**

#### Customer Email (Auto-filled)
```typescript
1. Auto-populate from selected order
2. Make field read-only
3. Display with disabled styling
```

#### Doctor's Notes
```typescript
1. User types in textarea
2. Update state on each keystroke
3. Validate:
   - Not empty
   - Minimum 10 characters
   - Maximum 5000 characters
4. Show character count
5. Show error if validation fails
```

#### Signature PDF Upload
```typescript
1. User clicks "Upload Signature" button
2. Open file picker (accept: .pdf only)
3. User selects PDF file
4. Validate file:
   - Must be PDF format
   - Maximum size: 5MB
   - Not corrupted
5. If valid:
   - Convert to base64
   - Store in state
   - Display filename
   - Show preview icon
6. If invalid:
   - Show error message
   - Clear file input
```

**File Conversion Logic:**
```typescript
function convertPdfToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      // Remove data:application/pdf;base64, prefix
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

---

### 5. Form Validation

**Trigger:** Before submission

**Logic:**
```typescript
// Validation checks

function validateForm(formData) {
  const errors = []
  
  // Check customer email
  if (!formData.customerEmail || !isValidEmail(formData.customerEmail)) {
    errors.push('Valid customer email is required')
  }
  
  // Check doctor's notes
  if (!formData.doctorNotes) {
    errors.push('Doctor\'s notes are required')
  }
  if (formData.doctorNotes.length < 10) {
    errors.push('Doctor\'s notes must be at least 10 characters')
  }
  if (formData.doctorNotes.length > 5000) {
    errors.push('Doctor\'s notes must not exceed 5000 characters')
  }
  
  // Check signature PDF
  if (!formData.signaturePdf) {
    errors.push('Signature PDF is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

**Enable/Disable Submit Button:**
```typescript
const isSubmitDisabled = 
  !formData.customerEmail ||
  !formData.doctorNotes ||
  formData.doctorNotes.length < 10 ||
  !formData.signaturePdf
```

---

### 6. Form Submission

**Trigger:** User clicks Submit button

**Logic:**
```typescript
// components/OrderDetails.tsx

async function handleSubmit() {
  // 1. Validate form
  const validation = validateForm(formData)
  if (!validation.isValid) {
    showErrors(validation.errors)
    return
  }
  
  // 2. Show loading state
  setIsSubmitting(true)
  
  // 3. Convert signature PDF to base64 (if not already)
  const signatureBase64 = await convertPdfToBase64(formData.signaturePdf)
  
  // 4. Prepare payload
  const payload = {
    orderId: selectedOrder.orderId,
    customerEmail: formData.customerEmail,
    doctorNotes: formData.doctorNotes,
    signaturePdf: signatureBase64
  }
  
  // 5. Send to API
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error('Submission failed')
    }
    
    // 6. Handle success
    const result = await response.json()
    onSubmitSuccess(selectedOrder.orderId)
    
  } catch (error) {
    // 7. Handle error
    showError('Failed to submit prescription form')
  } finally {
    // 8. Hide loading state
    setIsSubmitting(false)
  }
}
```

---

### 7. Sending to n8n Webhook

**Trigger:** API route receives submission

**Logic:**
```typescript
// app/api/submit/route.ts

export async function POST(request: Request) {
  // 1. Parse request body
  const body = await request.json()
  const { orderId, customerEmail, doctorNotes, signaturePdf } = body
  
  // 2. Validate data
  if (!orderId || !customerEmail || !doctorNotes || !signaturePdf) {
    return Response.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }
  
  // 3. Prepare webhook payload
  const webhookPayload = {
    orderId,
    customerEmail,
    doctorNotes,
    signaturePdf,
    submittedAt: new Date().toISOString()
  }
  
  // 4. Send to n8n webhook and wait for workflow completion
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

    // Create abort controller with 120 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.N8N_API_KEY || ''
      },
      body: JSON.stringify(webhookPayload),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status}`)
    }

    // Parse response from n8n workflow (from "Respond to Webhook" node)
    const responseData = await response.json().catch(() => ({}))

    // 5. Return success with data from n8n
    return Response.json({
      success: true,
      message: 'Prescription form submitted successfully',
      data: responseData
    })

  } catch (error) {
    // 6. Handle error
    if (error.name === 'AbortError') {
      console.error('n8n webhook timed out after 120 seconds')
      return Response.json(
        { error: 'Workflow timed out after 120 seconds' },
        { status: 500 }
      )
    }

    console.error('Failed to send to n8n:', error)
    return Response.json(
      { error: 'Failed to submit to n8n' },
      { status: 500 }
    )
  }
}
```

---

### 8. Post-Submission Cleanup

**Trigger:** Successful submission response

**Logic:**
```typescript
// page.tsx

function onSubmitSuccess(orderId: string) {
  // 1. Remove order from pending list
  setPendingOrders(prev => 
    prev.filter(order => order.orderId !== orderId)
  )
  
  // 2. Clear selected order
  setSelectedOrder(null)
  
  // 3. Reset form
  setFormData({
    customerEmail: '',
    doctorNotes: '',
    signaturePdf: null
  })
  
  // 4. Show success notification
  showSuccessToast('Prescription form submitted successfully!')
  
  // 5. If more orders exist, auto-select next one
  if (pendingOrders.length > 1) {
    const nextOrder = pendingOrders.find(o => o.orderId !== orderId)
    if (nextOrder) {
      setSelectedOrder(nextOrder)
    }
  }
}
```

---

### 9. Error Handling Logic

**API Errors:**
```typescript
function handleApiError(error: Error) {
  // Check error type
  if (error.message.includes('network')) {
    showError('Network error. Please check your connection.')
  } else if (error.message.includes('timeout')) {
    showError('Request timed out. Please try again.')
  } else {
    showError('An error occurred. Please try again.')
  }
  
  // Log for debugging
  console.error('API Error:', error)
}
```

**File Upload Errors:**
```typescript
function handleFileError(error: string) {
  switch (error) {
    case 'INVALID_TYPE':
      showError('Please upload a PDF file')
      break
    case 'FILE_TOO_LARGE':
      showError('File size must be less than 5MB')
      break
    case 'CORRUPTED_FILE':
      showError('File appears to be corrupted')
      break
    default:
      showError('Failed to upload file')
  }
}
```

---

### 10. State Persistence

**Save to LocalStorage:**
```typescript
// Save pending orders on every update
useEffect(() => {
  localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders))
}, [pendingOrders])

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('pendingOrders')
  if (saved) {
    setPendingOrders(JSON.parse(saved))
  }
}, [])
```

**Auto-save Draft:**
```typescript
// Save form draft every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (formData.doctorNotes && selectedOrder) {
      localStorage.setItem(
        `draft-${selectedOrder.orderId}`,
        JSON.stringify(formData)
      )
    }
  }, 30000) // 30 seconds
  
  return () => clearInterval(interval)
}, [formData, selectedOrder])
```

---

## n8n Workflow Logic

### Workflow Steps
```
1. Shopify Trigger (Order Created)
   ↓
2. HTTP Request Node (Send to Webapp)
   - Method: POST
   - URL: https://your-webapp.vercel.app/api/orders
   - Body: Order data (mapped from Shopify)
   ↓
3. Webhook Node (Wait for Doctor Submission)
   - Path: /doctor-submission
   - Method: POST
   - Receives: orderId, customerEmail, doctorNotes, signaturePdf
   ↓
4. Code Node (Process Signature PDF)
   - Decode base64
   - Save to binary data
   ↓
5. Generate Prescription (Your existing logic)
   ↓
6. Send Email to Customer
```

### HTTP Request Node Configuration

**To Send Order to Webapp:**
```json
{
  "method": "POST",
  "url": "https://your-webapp.vercel.app/api/orders",
  "headers": {
    "Content-Type": "application/json",
    "X-API-Key": "your-secret-key"
  },
  "body": {
    "orderId": "={{$json.id}}",
    "orderNumber": "={{$json.order_number}}",
    "customerName": "={{$json.customer.first_name}} ={{$json.customer.last_name}}",
    "customerEmail": "={{$json.customer.email}}",
    "totalAmount": "={{$json.total_price}}",
    "currency": "={{$json.currency}}",
    "orderDate": "={{$json.created_at}}",
    "lineItems": "={{JSON.stringify($json.line_items)}}",
    "shippingAddress": "={{JSON.stringify($json.shipping_address)}}",
    "tags": "={{$json.tags}}"
  }
}
```

### Webhook Node Configuration

**To Receive Doctor Submission:**
```
Path: doctor-submission
Method: POST
Response Mode: Wait for Webhook Response (REQUIRED)
Authentication: None (or Header Auth with API key)
Timeout: 120 seconds
```

**Important:** The webhook MUST be set to "Wait for Webhook Response" mode. The webapp waits up to 2 minutes for the workflow to complete. This is essential for:
- Proper session management with multiple concurrent doctors
- Confirmation that the prescription was successfully generated
- Returning prescription ID and PDF URL to the doctor

**Expected Payload:**
```json
{
  "orderId": "6505200976121",
  "customerEmail": "jjmouse77@hotmail.com",
  "doctorNotes": "Patient requires AOD-9604 for weight management...",
  "signaturePdf": "JVBERi0xLjQKJeLjz9MKMSAwIG9iag..."
}
```

**Required Response (from "Respond to Webhook" node):**
```json
{
  "success": true,
  "prescriptionId": "12345",
  "pdfUrl": "https://storage.example.com/prescriptions/12345.pdf",
  "message": "Prescription generated successfully"
}
```

### Code Node (Process PDF)
```javascript
// Get webhook data
const submission = $input.first().json;

// Extract and prepare signature PDF
const signatureBase64 = submission.signaturePdf;
const signatureBuffer = Buffer.from(signatureBase64, 'base64');

return {
  json: {
    orderId: submission.orderId,
    customerEmail: submission.customerEmail,
    doctorNotes: submission.doctorNotes,
    submittedAt: new Date().toISOString()
  },
  binary: {
    signature: {
      data: signatureBuffer,
      mimeType: 'application/pdf',
      fileName: `signature_${submission.orderId}.pdf`
    }
  }
};
```

---

## Security Considerations

### API Key Validation
```typescript
// app/api/orders/route.ts

export async function POST(request: Request) {
  // Validate API key
  const apiKey = request.headers.get('X-API-Key')
  if (apiKey !== process.env.N8N_API_KEY) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Process request...
}
```

### CORS Configuration
```typescript
// app/api/orders/route.ts

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://your-n8n-instance.app',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key'
    }
  })
}
```

### Input Sanitization
```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/<script>/gi, '')
    .replace(/<\/script>/gi, '')
    .trim()
}
```