# Doctor's Prescription Form - Webapp Plan

## Tech Stack
- **Frontend Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **PDF Handling:** react-pdf or pdf-lib
- **State Management:** React useState/useContext
- **API Communication:** Next.js API Routes

---

## Architecture Overview

### Two-Panel Layout
```
┌─────────────────────────────────────────────────────────┐
│                     Doctor Portal                        │
├──────────────────────┬──────────────────────────────────┤
│   LEFT PANEL         │      RIGHT PANEL                 │
│                      │                                  │
│  Pending Orders      │   Order Details                  │
│  (List View)         │   ┌──────────────────────────┐  │
│                      │   │ Customer Email           │  │
│  ┌────────────────┐  │   └──────────────────────────┘  │
│  │ Order #52149   │  │                                  │
│  │ MaryAlice M.   │◄─┼─► ┌──────────────────────────┐  │
│  │ $322.20        │  │   │ Doctor's Notes           │  │
│  └────────────────┘  │   │ (Textarea)               │  │
│                      │   └──────────────────────────┘  │
│  ┌────────────────┐  │                                  │
│  │ Order #52150   │  │   ┌──────────────────────────┐  │
│  │ John D.        │  │   │ Upload Signature PDF     │  │
│  │ $450.00        │  │   └──────────────────────────┘  │
│  └────────────────┘  │                                  │
│                      │   [Submit] Button                │
└──────────────────────┴──────────────────────────────────┘
```

---

## Project Structure
```
doctor-prescription-app/
├── app/
│   ├── api/
│   │   ├── orders/
│   │   │   └── route.ts          # Receive orders from n8n
│   │   └── submit/
│   │       └── route.ts          # Send completed forms to n8n
│   ├── page.tsx                  # Main doctor portal page
│   └── layout.tsx
├── components/
│   ├── OrderList.tsx             # Left panel - order list
│   ├── OrderDetails.tsx          # Right panel - form
│   └── OrderCard.tsx             # Individual order card
├── lib/
│   ├── types.ts                  # TypeScript interfaces
│   └── store.ts                  # Simple state management
└── public/
```

---

## Key Components

### 1. OrderList Component (Left Panel)
- Display pending orders in cards/boxes
- Each card shows:
  - Order number
  - Customer name
  - Total amount
  - Order date
- Click to select and view details
- Highlight selected order

### 2. OrderDetails Component (Right Panel)
- **Customer Email Field** (auto-filled, read-only)
- **Doctor's Notes Textarea** (required)
- **Signature PDF Upload** (required)
- **Submit Button** (enabled when all fields filled)

### 3. Order Storage
- Store incoming orders in memory/state (or localStorage for persistence)
- Remove order from list after successful submission

---

## Data Flow

### Incoming (n8n → Webapp)
1. n8n sends POST request to `/api/orders`
2. Webapp receives order data
3. Order added to pending queue
4. Display in left panel

### Outgoing (Webapp → n8n)
1. Doctor fills form and submits
2. POST to `/api/submit`
3. Send to n8n webhook:
   - Order ID
   - Customer Email
   - Doctor's Notes
   - Signature PDF (base64)
4. Remove from pending list on success

---

## API Endpoints

### `/api/orders` (POST)
**Purpose:** Receive new orders from n8n

**Request Body:**
```json
{
  "orderId": "6505200976121",
  "orderNumber": "52149",
  "customerName": "MaryAlice Morgan",
  "customerEmail": "jjmouse77@hotmail.com",
  "totalAmount": "322.20",
  "currency": "AUD",
  "orderDate": "2025-10-30T14:31:03+11:00",
  "lineItems": [...],
  "shippingAddress": {...},
  "tags": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order added to queue"
}
```

### `/api/submit` (POST)
**Purpose:** Send completed prescription form to n8n

**Request Body:**
```json
{
  "orderId": "6505200976121",
  "customerEmail": "jjmouse77@hotmail.com",
  "doctorNotes": "Patient requires...",
  "signaturePdf": "base64_encoded_pdf_string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription form submitted"
}
```

---

## n8n Cloud Configuration

### Sending Orders to Webapp (HTTP Request Node)

**Node Configuration:**
- **Method:** POST
- **URL:** `https://your-webapp.vercel.app/api/orders`
- **Authentication:** None (or add API key in headers)
- **Headers:**
  - `Content-Type: application/json`
  - `X-API-Key: your-secret-key` (optional)

**Body (JSON):**
```json
{
  "orderId": "{{$json.id}}",
  "orderNumber": "{{$json.order_number}}",
  "customerName": "{{$json.customer.first_name}} {{$json.customer.last_name}}",
  "customerEmail": "{{$json.customer.email}}",
  "totalAmount": "{{$json.total_price}}",
  "currency": "{{$json.currency}}",
  "orderDate": "{{$json.created_at}}",
  "lineItems": "{{JSON.stringify($json.line_items)}}",
  "shippingAddress": "{{JSON.stringify($json.shipping_address)}}",
  "tags": "{{$json.tags}}"
}
```

### Receiving Doctor's Submission (Webhook Node)

**Node Configuration:**
- **Path:** `/doctor-submission`
- **Method:** POST
- **Response Mode:** Respond when workflow finishes

**Expected Data from Webapp:**
```json
{
  "orderId": "6505200976121",
  "customerEmail": "jjmouse77@hotmail.com",
  "doctorNotes": "...",
  "signaturePdf": "base64_string"
}
```

---

## Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.app/webhook/doctor-submission
N8N_API_KEY=your-secret-api-key
```

---

## Key Features

### Order Management
- Real-time order queue
- Visual indication of pending vs completed
- Order persistence (localStorage)

### Form Validation
- All fields required before submit
- Email validation
- PDF file type validation
- File size limit (max 5MB)

### User Feedback
- Loading states during submission
- Success/error notifications
- Confirmation before submit

### Security
- API key authentication
- CORS configuration
- Input sanitization

---

## Deployment

### Webapp
- Deploy to Vercel
- Set environment variables
- Get production URL

### n8n Webhook URL
- Update webapp's `.env.local` with n8n webhook URL
- Test connection between services

---

## State Management

### Order State
```typescript
{
  pendingOrders: Order[],
  selectedOrder: Order | null,
  isSubmitting: boolean
}
```

### Form State
```typescript
{
  customerEmail: string,
  doctorNotes: string,
  signaturePdf: File | null
}
```

---

## File Upload Handling

### Signature PDF Upload
1. User selects PDF file
2. Validate file type and size
3. Convert to base64
4. Store in state
5. Send with form submission

---

## Error Handling

### API Errors
- Network failures
- Invalid responses
- Timeout handling

### User Errors
- Missing required fields
- Invalid file formats
- Large file sizes

### Display Errors
- Toast notifications
- Form field errors
- Retry mechanisms