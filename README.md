# Doctor's Order Portal

A Next.js web application for doctors to manage and process prescription orders received from n8n workflows.

## Features

- **Two-Panel Layout**: View pending orders on the left, process them on the right
- **Real-time Order Reception**: Automatically receives orders from n8n via webhook
- **Form Validation**: Ensures all required fields are filled before submission
- **PDF Upload**: Upload and validate signature PDFs
- **Persistent Storage**: Orders are saved to localStorage for persistence
- **Auto-submission to n8n**: Completed forms are sent back to n8n for processing

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks + custom store
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
The `.env.local` file is already configured with your n8n webhook URL:
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://valerie-ai.app.n8n.cloud/webhook-test/2a69ecab-5192-4f30-ac17-cccc7f6ea15c
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### For Doctors

1. **View Pending Orders**: Orders appear in the left panel when received from n8n
2. **Select an Order**: Click on an order card to view details
3. **Fill the Form**:
   - Customer email is auto-filled (read-only)
   - Enter doctor's notes (minimum 10 characters)
   - Upload signature PDF (max 5MB)
4. **Submit**: Click "Submit Prescription Form" to send to n8n

### Testing with n8n

#### Sending Orders to the Webapp

Configure your n8n HTTP Request node to send orders:

**URL**: `http://localhost:3000/api/receive-order` (or your deployed URL)

**Method**: POST

**Body** (JSON):
```json
{
  "orderId": "6505200976121",
  "orderNumber": "52149",
  "customerName": "MaryAlice Morgan",
  "customerEmail": "customer@example.com",
  "totalAmount": "322.20",
  "currency": "AUD",
  "orderDate": "2025-10-30T14:31:03+11:00",
  "lineItems": "...",
  "shippingAddress": "...",
  "tags": "..."
}
```

#### Receiving Completed Forms in n8n

The webapp sends completed forms to your configured webhook:
`https://valerie-ai.app.n8n.cloud/webhook-test/2a69ecab-5192-4f30-ac17-cccc7f6ea15c`

**Payload**:
```json
{
  "orderId": "6505200976121",
  "customerEmail": "customer@example.com",
  "doctorNotes": "Patient requires...",
  "signaturePdf": "base64_encoded_pdf_string",
  "submittedAt": "2025-11-15T10:30:00.000Z"
}
```

## API Endpoints

### POST `/api/receive-order`
Receives new orders from n8n and adds them to the queue.

### GET `/api/receive-order`
Returns pending orders (used by the frontend for polling).

### POST `/api/submit`
Submits completed prescription forms to n8n webhook.

## Project Structure

```
biov8/
├── app/
│   ├── api/
│   │   ├── orders/route.ts          # Legacy endpoint
│   │   ├── receive-order/route.ts   # Receives orders from n8n
│   │   └── submit/route.ts          # Sends completed forms to n8n
│   ├── page.tsx                     # Main doctor portal page
│   ├── layout.tsx                   # Root layout
│   └── globals.css                  # Global styles
├── components/
│   ├── OrderList.tsx                # Left panel - order list
│   ├── OrderDetails.tsx             # Right panel - form
│   └── OrderCard.tsx                # Individual order card
├── lib/
│   ├── types.ts                     # TypeScript interfaces
│   └── store.ts                     # Order state management
├── Logic.md                         # Detailed logic documentation
├── Plan.md                          # Project plan
└── README.md                        # This file
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variable:
   - `NEXT_PUBLIC_N8N_WEBHOOK_URL`: Your n8n webhook URL
4. Deploy

### Update n8n Configuration

After deployment, update your n8n HTTP Request node URL to:
`https://your-app.vercel.app/api/receive-order`

## Development

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

### Lint
```bash
pnpm lint
```

## Troubleshooting

### Orders not appearing?
- Check that n8n is sending requests to the correct URL
- Verify the request payload matches the expected format
- Check browser console for errors

### Submission failing?
- Verify the n8n webhook URL is correct in `.env.local`
- Check that the webhook is active in n8n
- Ensure PDF file is under 5MB

### Orders disappearing after refresh?
- Orders are stored in localStorage
- Check browser console for localStorage errors
- Try clearing localStorage and receiving new orders

## License

Private project - All rights reserved

