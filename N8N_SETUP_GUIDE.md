# n8n Prescription Generator Setup Guide

## Overview
This guide explains how to set up the prescription generation workflow in n8n using the new template files that support multiple medicines and health assessments.

## Files Included

1. **n8n-prescription-processor.js** - Code node that processes webhook data
2. **n8n-prescription-template.html** - HTML template with n8n variables
3. **prescription_template.html** - Original Handlebars template (legacy)

## n8n Workflow Setup

### Step 1: Webhook Node (Trigger)
This receives the prescription data from your webapp.

**Configuration:**
- **HTTP Method:** POST
- **Path:** `/prescription-submit` (or your preferred path)
- **Response Mode:** Wait for Webhook Response
- **Response Code:** 200

**Important:** The webhook MUST be set to "Wait for Webhook Response" mode so that the webapp waits for the workflow to complete before returning to the doctor. This ensures proper session management when multiple doctors are using the system simultaneously.

The webhook will receive data including:
- Patient information
- Doctor information
- Medicine details
- Health assessment answers
- Signature (base64)

### Step 2: Code Node - Process Data
Add a **Code** node after the webhook to process the incoming data.

**Configuration:**
- **Language:** JavaScript
- **Mode:** Run Once for All Items
- **Code:** Copy the entire content from `n8n-prescription-processor.js`

**What it does:**
- Extracts all data from the webhook
- Parses line items (medicines) from the order
- Generates HTML table rows for medicines (handles 1, 10, or any number)
- Formats dates
- Prepares signature image
- Outputs structured data for the HTML template

### Step 3: HTML Node - Generate Prescription
Add an **HTML** node after the Code node.

**Configuration:**
- **Operation:** Extract HTML Content
- **Source Data:** From Previous Node
- **HTML Template:** Copy the entire content from `n8n-prescription-template.html`

**Important:** The HTML node will replace all `{{ $json.variableName }}` placeholders with actual data from the Code node.

### Step 4: Convert to PDF (Optional)
Add a **Convert to File** node or use a PDF generation service.

**Option A: Using n8n's HTML to PDF**
- **Node:** HTML to PDF
- **HTML:** `{{ $json.html }}` from previous node
- **File Name:** `Prescription_{{ $json.orderNumber }}.pdf`

**Option B: Using external service (Puppeteer, wkhtmltopdf, etc.)**
- Configure according to your preferred PDF service

### Step 5: Send Email or Store PDF
Add nodes to:
- Email the prescription to the patient
- Store in cloud storage (Google Drive, Dropbox, etc.)
- Update your database with prescription status

### Step 6: Respond to Webhook (REQUIRED)
**This is the final node in your workflow and is REQUIRED for proper operation.**

Add a **Respond to Webhook** node as the last node in your workflow.

**Configuration:**
- **Response Code:** 200
- **Response Body:** JSON with success status and any relevant data

**Example Response:**
```json
{
  "success": true,
  "prescriptionId": "{{ $json.prescriptionId }}",
  "pdfUrl": "{{ $json.pdfUrl }}",
  "message": "Prescription generated successfully"
}
```

**Why this is required:**
- The webapp waits up to 2 minutes for the workflow to complete
- Multiple doctors can use the system simultaneously without conflicts
- Each doctor gets confirmation that their specific prescription was processed
- The webapp receives the prescription ID and PDF URL for display/storage

## Data Flow Diagram

```
Webapp Submission (Doctor submits form)
    ↓
[Webhook Node] - Receives POST request (Wait for Webhook Response mode)
    ↓
[Code Node] - Processes data & generates medicine HTML
    ↓
[HTML Node] - Renders prescription template
    ↓
[PDF Converter] - Converts HTML to PDF
    ↓
[Email/Storage] - Sends or stores prescription
    ↓
[Respond to Webhook] - Sends response back to webapp (REQUIRED)
    ↓
Webapp receives confirmation and displays to doctor
```

## Medicine Handling

The template supports **dynamic medicine lists**:

### Scenario 1: Single Medicine
If the webapp sends:
```json
{
  "medicineName": "Semaglutide",
  "medicineQuantity": "4 pens",
  "medicineDescription": "Inject 0.25mg weekly for 4 weeks"
}
```

The template will display 1 row in the medicines table.

### Scenario 2: Multiple Medicines (from lineItems)
If the order has multiple line items:
```json
{
  "lineItems": [
    {"name": "Semaglutide 0.25mg", "quantity": 4, "variant_title": "4-week starter pack"},
    {"name": "Semaglutide 0.5mg", "quantity": 4, "variant_title": "4-week maintenance"},
    {"name": "Needles", "quantity": 8, "sku": "Safety needles 4mm"}
  ]
}
```

The template will display 3 rows in the medicines table, automatically stacking all items.

## Variables Reference

### Patient Information
- `{{ $json.patientName }}` - Patient's full name
- `{{ $json.patientState }}` - Patient's state/province

### Doctor Information
- `{{ $json.doctorName }}` - Doctor's name

### Medicines
- `{{ $json.medicinesHtml }}` - Pre-generated HTML table rows (handles multiple medicines)

### Other Sections
- `{{ $json.bundleBreakdown }}` - Comma-separated list of all items
- `{{ $json.doctorNote }}` - Doctor's notes and instructions

### Health Assessment
- `{{ $json.healthChanges }}` - Health changes in past 6 months
- `{{ $json.takingMedications }}` - Current medications
- `{{ $json.hadMedicationBefore }}` - Previous use of this medication
- `{{ $json.pregnancyStatus }}` - Pregnancy/breastfeeding status
- `{{ $json.allergicReaction }}` - Allergic reactions to medication
- `{{ $json.allergies }}` - Any allergies
- `{{ $json.medicalConditions }}` - Current medical conditions

### Signature & Dates
- `{{ $json.signatureImage }}` - Base64 signature image (data URL format)
- `{{ $json.signatureDate }}` - Formatted signature date
- `{{ $json.prescriptionDate }}` - Formatted prescription date

### Metadata
- `{{ $json.orderId }}` - Order ID
- `{{ $json.orderNumber }}` - Order number

## Testing

1. **Test with 1 medicine:**
   - Submit a prescription with single medicine from webapp
   - Verify it displays correctly in the PDF

2. **Test with multiple medicines:**
   - Submit an order with multiple line items
   - Verify all medicines stack in the table

3. **Test health assessments:**
   - Fill all health assessment questions
   - Verify they display in the prescription

## Troubleshooting

### Issue: Medicines not displaying
- Check that the Code node is generating `medicinesHtml` correctly
- Verify lineItems are being parsed properly
- Check console logs in the Code node

### Issue: Signature not showing
- Verify signature is base64 encoded
- Check that it's being converted to data URL in Code node
- Ensure image tag in HTML is not blocked

### Issue: Variables showing as {{ $json.xxx }}
- Make sure you're using the HTML node correctly
- Verify the Code node output has all required fields
- Check that variable names match exactly

## Concurrent Usage & Session Management

This webapp is designed for **multiple doctors to use simultaneously** (internal use, not public).

**How it handles concurrent requests:**
- Each doctor's submission creates an independent request with a unique request ID
- The webapp waits up to 2 minutes for each workflow to complete
- No shared state between requests - each doctor's session is isolated
- Database uses connection pooling (max 20 concurrent connections)
- Request tracking via unique IDs in logs for debugging

**Important:** Make sure your n8n webhook is set to "Wait for Webhook Response" mode and includes a "Respond to Webhook" node at the end. This ensures each doctor receives confirmation for their specific submission.

## Next Steps

After setup:
1. Test the workflow end-to-end with a single submission
2. Test with multiple concurrent submissions (simulate multiple doctors)
3. Configure error handling
4. Set up email notifications
5. Add logging for audit trail
6. Configure backup storage for prescriptions
7. Verify the "Respond to Webhook" node is working correctly

