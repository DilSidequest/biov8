# Webhook Configuration Update - Session Management

## Summary of Changes

This update ensures the webapp properly waits for n8n workflow completion and handles multiple concurrent doctors correctly.

## What Changed

### 1. API Routes - Increased Timeout
**Files Modified:**
- `app/api/submit/route.ts`
- `app/api/fetch-customer/route.ts`

**Changes:**
- Timeout increased from 30 seconds to **120 seconds (2 minutes)**
- Added unique request ID tracking for concurrent requests
- Enhanced logging with request IDs for debugging
- Response now includes data from n8n workflow

### 2. Documentation Updates
**Files Modified:**
- `N8N_SETUP_GUIDE.md`
- `Logic.md`

**Changes:**
- Updated webhook configuration from "Respond Immediately" to **"Wait for Webhook Response"**
- Added required "Respond to Webhook" node documentation
- Added section on concurrent usage and session management
- Clarified that this is for multiple doctors (internal use)

## How It Works Now

### Request Flow
```
Doctor submits form
    ↓
Webapp generates unique request ID
    ↓
Webapp sends to n8n webhook (waits up to 2 minutes)
    ↓
n8n processes workflow (generate PDF, send email, etc.)
    ↓
n8n "Respond to Webhook" node sends response
    ↓
Webapp receives response with prescription ID and PDF URL
    ↓
Doctor sees confirmation
```

### Concurrent Usage
- **Multiple doctors can submit simultaneously** - each request is independent
- Each request has a unique ID for tracking in logs
- No shared state between requests
- Database connection pooling handles concurrent database operations
- Each doctor receives confirmation for their specific submission

## Required n8n Configuration

### Webhook Node Settings
```
HTTP Method: POST
Path: /prescription-submit (or your path)
Response Mode: Wait for Webhook Response ⚠️ REQUIRED
Response Code: 200
```

### Last Node: Respond to Webhook
Add this as the **final node** in your workflow:

**Node Type:** Respond to Webhook
**Response Code:** 200
**Response Body:**
```json
{
  "success": true,
  "prescriptionId": "{{ $json.prescriptionId }}",
  "pdfUrl": "{{ $json.pdfUrl }}",
  "message": "Prescription generated successfully"
}
```

## Testing

### Test Single Submission
1. Submit a prescription form
2. Check logs for request ID
3. Verify workflow completes within 2 minutes
4. Confirm response is received

### Test Concurrent Submissions
1. Have 2-3 doctors submit forms simultaneously
2. Check logs - each should have unique request ID
3. Verify all workflows complete successfully
4. Confirm no interference between requests

## Troubleshooting

### "Webhook request timed out after 120 seconds"
- Your n8n workflow is taking longer than 2 minutes
- Optimize workflow or increase timeout further
- Check for bottlenecks in PDF generation or email sending

### "Webhook failed with status XXX"
- Check n8n workflow for errors
- Verify "Respond to Webhook" node is configured correctly
- Check n8n logs for the specific workflow execution

### Multiple doctors seeing wrong data
- This should NOT happen with current implementation
- Each request is isolated with unique ID
- Check logs for request ID to trace specific submission
- Verify no client-side caching issues

## Log Format

All logs now include request ID for tracking:
```
[1732454321000-abc123def] Received submission request for order: 12345 Order #: 67890
[1732454321000-abc123def] Sending payload to n8n webhook...
[1732454321000-abc123def] n8n webhook response status: 200
[1732454321000-abc123def] n8n webhook response: { success: true, ... }
```

This makes it easy to trace a specific doctor's submission through the entire process.

## Next Steps

1. ✅ Update n8n webhook to "Wait for Webhook Response" mode
2. ✅ Add "Respond to Webhook" node as last node in workflow
3. ✅ Test with single submission
4. ✅ Test with multiple concurrent submissions
5. ✅ Monitor logs to verify request tracking works
6. ✅ Verify timeout is sufficient for your workflow

## Important Notes

- This webapp is for **internal use by multiple doctors**, not a public app
- Each doctor's session is completely isolated
- The 2-minute timeout should be sufficient for most workflows
- If your workflow needs more time, increase the timeout in both API routes
- Always include the "Respond to Webhook" node - it's required for proper operation

